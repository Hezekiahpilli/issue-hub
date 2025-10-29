import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import Layout from '@/components/Layout';
import AuthGuard from '@/components/AuthGuard';
import { projectsApi } from '@/lib/api';
import { Project } from '@/types';
import {
  PlusIcon,
  FolderOpenIcon,
  UsersIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface CreateProjectForm {
  name: string;
  key: string;
  description: string;
}

export default function Projects() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectForm>();
  
  useEffect(() => {
    loadProjects();
  }, []);
  
  const loadProjects = async () => {
    try {
      const response = await projectsApi.list();
      setProjects(response.data);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };
  
  const onCreateProject = async (data: CreateProjectForm) => {
    setIsCreating(true);
    try {
      await projectsApi.create({
        name: data.name,
        key: data.key.toUpperCase(),
        description: data.description || undefined,
      });
      toast.success('Project created successfully');
      setShowCreateModal(false);
      reset();
      loadProjects();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <AuthGuard>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your projects and track issues
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Project
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="mt-8 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="mt-8 text-center">
              <FolderOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Project
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="card p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary-100 text-primary-800">
                          {project.key}
                        </span>
                      </div>
                      <h3 className="mt-2 text-lg font-medium text-gray-900">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-gray-500 space-x-4">
                    <span className="flex items-center">
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      {project.issue_count || 0} issues
                    </span>
                    <span className="flex items-center">
                      <UsersIcon className="h-4 w-4 mr-1" />
                      {project.member_count || 0} members
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          {/* Create Project Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)}></div>
                
                <div className="relative bg-white rounded-lg max-w-md w-full p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Create New Project</h3>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit(onCreateProject)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Project Name
                      </label>
                      <input
                        {...register('name', {
                          required: 'Project name is required',
                          minLength: {
                            value: 3,
                            message: 'Project name must be at least 3 characters',
                          },
                        })}
                        type="text"
                        className="mt-1 input-field"
                        placeholder="My Awesome Project"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Project Key
                      </label>
                      <input
                        {...register('key', {
                          required: 'Project key is required',
                          pattern: {
                            value: /^[A-Z0-9]{2,10}$/i,
                            message: 'Key must be 2-10 alphanumeric characters',
                          },
                        })}
                        type="text"
                        className="mt-1 input-field uppercase"
                        placeholder="PROJ"
                        maxLength={10}
                      />
                      {errors.key && (
                        <p className="mt-1 text-sm text-red-600">{errors.key.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Description (optional)
                      </label>
                      <textarea
                        {...register('description')}
                        rows={3}
                        className="mt-1 input-field"
                        placeholder="Brief description of the project..."
                      />
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
                        {isCreating ? 'Creating...' : 'Create Project'}
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
