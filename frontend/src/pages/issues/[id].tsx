import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import AuthGuard from '@/components/AuthGuard';
import { issuesApi, commentsApi, projectsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Issue, Comment, Project, IssueStatus, IssuePriority } from '@/types';
import {
  ChevronRightIcon,
  UserCircleIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface CommentForm {
  body: string;
}

interface UpdateForm {
  status: IssueStatus;
  priority: IssuePriority;
  assignee_id: string;
  expected_completion_date: string;
}

const statusOptions = [
  { value: 'open', label: 'Open', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-800' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800' },
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
];

export default function IssueDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuthStore();
  
  const [issue, setIssue] = useState<Issue | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const {
    register: registerComment,
    handleSubmit: handleSubmitComment,
    reset: resetComment,
    formState: { errors: commentErrors },
  } = useForm<CommentForm>();
  
  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    reset: resetUpdate,
    setValue: setUpdateValue,
  } = useForm<UpdateForm>();
  
  useEffect(() => {
    if (id) {
      loadIssue();
      loadComments();
    }
  }, [id]);
  
  const loadIssue = async () => {
    try {
      const response = await issuesApi.get(Number(id));
      setIssue(response.data);
      
      // Load project details
      const projectResponse = await projectsApi.get(response.data.project_id);
      setProject(projectResponse.data);
      
      // Set initial update form values
      setUpdateValue('status', response.data.status);
      setUpdateValue('priority', response.data.priority);
      setUpdateValue('assignee_id', response.data.assignee_id?.toString() || '');
      if (response.data.expected_completion_date) {
        const date = new Date(response.data.expected_completion_date);
        setUpdateValue('expected_completion_date', date.toISOString().slice(0, 16));
      } else {
        setUpdateValue('expected_completion_date', '');
      }
    } catch (error) {
      toast.error('Failed to load issue');
      router.push('/projects');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadComments = async () => {
    try {
      const response = await commentsApi.list(Number(id));
      setComments(response.data);
    } catch (error) {
      toast.error('Failed to load comments');
    }
  };
  
  const onSubmitComment = async (data: CommentForm) => {
    setIsSubmittingComment(true);
    try {
      await commentsApi.create(Number(id), { body: data.body });
      toast.success('Comment added');
      resetComment();
      loadComments();
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  const onUpdateIssue = async (data: UpdateForm) => {
    setIsUpdating(true);
    try {
      await issuesApi.update(Number(id), {
        status: data.status,
        priority: data.priority,
        assignee_id: data.assignee_id ? Number(data.assignee_id) : null,
        expected_completion_date: data.expected_completion_date || undefined,
      });
      toast.success('Issue updated');
      setIsEditing(false);
      loadIssue();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update issue');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDeleteIssue = async () => {
    if (!confirm('Are you sure you want to delete this issue?')) {
      return;
    }
    
    try {
      await issuesApi.delete(Number(id));
      toast.success('Issue deleted');
      router.push(`/projects/${issue?.project_id}`);
    } catch (error) {
      toast.error('Failed to delete issue');
    }
  };
  
  const isMaintainer = project?.members?.some(
    m => m.user.id === user?.id && m.role === 'maintainer'
  );
  
  const canEdit = isMaintainer || issue?.reporter_id === user?.id;
  const canDelete = isMaintainer || issue?.reporter_id === user?.id;
  
  if (isLoading) {
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
  
  if (!issue || !project) {
    return null;
  }
  
  const currentStatus = statusOptions.find(s => s.value === issue.status);
  const currentPriority = priorityOptions.find(p => p.value === issue.priority);
  
  return (
    <AuthGuard>
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-500 mb-6">
            <Link href="/projects" className="hover:text-gray-700">
              Projects
            </Link>
            <ChevronRightIcon className="h-4 w-4 mx-2" />
            <Link href={`/projects/${project.id}`} className="hover:text-gray-700">
              {project.name}
            </Link>
            <ChevronRightIcon className="h-4 w-4 mx-2" />
            <span className="text-gray-900">Issue #{issue.id}</span>
          </div>
          
          {/* Issue Header */}
          <div className="card p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{issue.title}</h1>
              {canDelete && (
                <button
                  onClick={handleDeleteIssue}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            
            {issue.description && (
              <p className="text-gray-700 whitespace-pre-wrap mb-4">{issue.description}</p>
            )}
            
            {/* Issue Metadata */}
            <div className="border-t pt-4">
              {isEditing ? (
                <form onSubmit={handleSubmitUpdate(onUpdateIssue)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select {...registerUpdate('status')} className="input-field">
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select {...registerUpdate('priority')} className="input-field">
                        {priorityOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assignee
                      </label>
                      <select {...registerUpdate('assignee_id')} className="input-field">
                        <option value="">Unassigned</option>
                        {project.members?.map((member) => (
                          <option key={member.user.id} value={member.user.id}>
                            {member.user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expected Completion Date
                      </label>
                      <input
                        {...registerUpdate('expected_completion_date')}
                        type="datetime-local"
                        className="input-field"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="btn-primary"
                    >
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Status:</span>
                        <span className={`ml-2 badge ${currentStatus?.color}`}>
                          {currentStatus?.label}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Priority:</span>
                        <span className={`ml-2 badge ${currentPriority?.color}`}>
                          {currentPriority?.label}
                        </span>
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center text-sm text-primary-600 hover:text-primary-800"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Reporter:</span>
                      <span className="ml-2 text-gray-900">{issue.reporter.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Assignee:</span>
                      <span className="ml-2 text-gray-900">
                        {issue.assignee?.name || 'Unassigned'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 text-gray-900">
                        {format(new Date(issue.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Updated:</span>
                      <span className="ml-2 text-gray-900">
                        {format(new Date(issue.updated_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    {issue.expected_completion_date && (
                      <div>
                        <span className="text-gray-500">Expected Completion:</span>
                        <span className="ml-2 text-gray-900">
                          {format(new Date(issue.expected_completion_date), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Comments Section */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
              Comments ({comments.length})
            </h2>
            
            {/* Comments List */}
            <div className="space-y-4 mb-6">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border-l-2 border-gray-200 pl-4">
                    <div className="flex items-start space-x-3">
                      <UserCircleIcon className="h-8 w-8 text-gray-400" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="font-medium text-gray-900">
                            {comment.author.name}
                          </span>
                          <span className="text-gray-500">
                            {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                          {comment.body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Add Comment Form */}
            <form onSubmit={handleSubmitComment(onSubmitComment)}>
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add a comment
                </label>
                <textarea
                  {...registerComment('body', {
                    required: 'Comment is required',
                    minLength: {
                      value: 1,
                      message: 'Comment cannot be empty',
                    },
                  })}
                  rows={3}
                  className="input-field"
                  placeholder="Write your comment..."
                />
                {commentErrors.body && (
                  <p className="mt-1 text-sm text-red-600">{commentErrors.body.message}</p>
                )}
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingComment}
                    className="btn-primary"
                  >
                    {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
}
