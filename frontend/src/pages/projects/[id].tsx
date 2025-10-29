import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import AuthGuard from '@/components/AuthGuard';
import { projectsApi, issuesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Project, Issue, IssueStatus, IssuePriority } from '@/types';
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface CreateIssueForm {
  title: string;
  description: string;
  priority: IssuePriority;
  assignee_id: string;
}

interface Filters {
  q: string;
  status: IssueStatus | '';
  priority: IssuePriority | '';
  assignee_id: string;
  sort: string;
}

const statusConfig = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: ClockIcon },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: ArrowPathIcon },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: XMarkIcon },
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800' },
};

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuthStore();
  
  const [project, setProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    q: '',
    status: '',
    priority: '',
    assignee_id: '',
    sort: 'created_at',
  });
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateIssueForm>({
    defaultValues: {
      priority: 'medium',
    },
  });
  
  useEffect(() => {
    if (id) {
      loadProject();
      loadIssues();
    }
  }, [id]);
  
  useEffect(() => {
    if (id) {
      loadIssues();
    }
  }, [filters]);
  
  const loadProject = async () => {
    try {
      const response = await projectsApi.get(Number(id));
      setProject(response.data);
    } catch (error) {
      toast.error('Failed to load project');
      router.push('/projects');
    } finally {
      setIsLoadingProject(false);
    }
  };
  
  const loadIssues = async () => {
    setIsLoadingIssues(true);
    try {
      const params: any = {};
      if (filters.q) params.q = filters.q;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.assignee_id) params.assignee_id = Number(filters.assignee_id);
      params.sort = filters.sort;
      
      const response = await issuesApi.list(Number(id), params);
      setIssues(response.data);
    } catch (error) {
      toast.error('Failed to load issues');
    } finally {
      setIsLoadingIssues(false);
    }
  };
  
  const onCreateIssue = async (data: CreateIssueForm) => {
    setIsCreating(true);
    try {
      await issuesApi.create(Number(id), {
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        assignee_id: data.assignee_id ? Number(data.assignee_id) : undefined,
      });
      toast.success('Issue created successfully');
      setShowCreateModal(false);
      reset();
      loadIssues();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create issue');
    } finally {
      setIsCreating(false);
    }
  };
  
  const isMaintainer = project?.members?.some(
    m => m.user.id === user?.id && m.role === 'maintainer'
  );
  
  if (isLoadingProject) {
    return (
      <AuthGuard>
        <Layout>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </Layout>
      </AuthGuard>
    );
  }
  
  if (!project) {
    return null;
  }
  
  return (
    <AuthGuard>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Project Header */}
          <div className="mb-8">
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <Link href="/projects" className="hover:text-gray-700">
                Projects
              </Link>
              <ChevronRightIcon className="h-4 w-4 mx-2" />
              <span className="text-gray-900">{project.name}</span>
            </div>
            
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <span className="badge bg-primary-100 text-primary-800 mr-3">
                    {project.key}
                  </span>
                  <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                </div>
                {project.description && (
                  <p className="mt-2 text-gray-600">{project.description}</p>
                )}
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span>{project.members?.length || 0} members</span>
                  <span>{issues.length} issues</span>
                </div>
              </div>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Issue
              </button>
            </div>
          </div>
          
          {/* Filters and Search */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search issues..."
                    value={filters.q}
                    onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                    className="pl-10 input-field"
                  />
                </div>
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filters
              </button>
            </div>
            
            {showFilters && (
              <div className="card p-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value as IssueStatus | '' })}
                      className="input-field"
                    >
                      <option value="">All</option>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters({ ...filters, priority: e.target.value as IssuePriority | '' })}
                      className="input-field"
                    >
                      <option value="">All</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assignee
                    </label>
                    <select
                      value={filters.assignee_id}
                      onChange={(e) => setFilters({ ...filters, assignee_id: e.target.value })}
                      className="input-field"
                    >
                      <option value="">All</option>
                      {project.members?.map((member) => (
                        <option key={member.user.id} value={member.user.id}>
                          {member.user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort by
                    </label>
                    <select
                      value={filters.sort}
                      onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                      className="input-field"
                    >
                      <option value="created_at">Created Date</option>
                      <option value="updated_at">Updated Date</option>
                      <option value="priority">Priority</option>
                      <option value="status">Status</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Issues List */}
          {isLoadingIssues ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : issues.length === 0 ? (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No issues found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.q || filters.status || filters.priority || filters.assignee_id
                  ? 'Try adjusting your filters'
                  : 'Get started by creating a new issue'}
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {issues.map((issue) => (
                  <li key={issue.id}>
                    <Link
                      href={`/issues/${issue.id}`}
                      className="block hover:bg-gray-50 px-6 py-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <span className={`badge ${statusConfig[issue.status].color}`}>
                              {statusConfig[issue.status].label}
                            </span>
                            <span className={`badge ${priorityConfig[issue.priority].color}`}>
                              {priorityConfig[issue.priority].label}
                            </span>
                          </div>
                          
                          <h3 className="mt-2 text-base font-medium text-gray-900 truncate">
                            {issue.title}
                          </h3>
                          
                          <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                            <span className="flex items-center">
                              <UserIcon className="h-4 w-4 mr-1" />
                              {issue.assignee?.name || 'Unassigned'}
                            </span>
                            <span>
                              Reported by {issue.reporter.name}
                            </span>
                            <span>
                              {format(new Date(issue.created_at), 'MMM d, yyyy')}
                            </span>
                            {issue.comment_count && issue.comment_count > 0 && (
                              <span>{issue.comment_count} comments</span>
                            )}
                          </div>
                        </div>
                        
                        <ChevronRightIcon className="h-5 w-5 text-gray-400 ml-4" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Create Issue Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4">
                <div
                  className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                  onClick={() => setShowCreateModal(false)}
                ></div>
                
                <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Create New Issue</h3>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit(onCreateIssue)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        {...register('title', {
                          required: 'Title is required',
                          minLength: {
                            value: 3,
                            message: 'Title must be at least 3 characters',
                          },
                        })}
                        type="text"
                        className="mt-1 input-field"
                        placeholder="Brief description of the issue"
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        {...register('description')}
                        rows={4}
                        className="mt-1 input-field"
                        placeholder="Detailed description of the issue..."
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Priority
                        </label>
                        <select
                          {...register('priority')}
                          className="mt-1 input-field"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Assignee
                        </label>
                        <select
                          {...register('assignee_id')}
                          className="mt-1 input-field"
                        >
                          <option value="">Unassigned</option>
                          {project.members?.map((member) => (
                            <option key={member.user.id} value={member.user.id}>
                              {member.user.name} ({member.role})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isCreating}
                        className="btn-primary"
                      >
                        {isCreating ? 'Creating...' : 'Create Issue'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
}
