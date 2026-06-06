'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button, Input, Card } from '@/components';
import { useApi } from '@/hooks/useApi';

interface Doctor {
  id: string;
  name: string;
  createdAt: string;
}

interface DoctorsResponse {
  doctors: {
    data: Doctor[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchWithAuth } = useApi();

  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithAuth(`/api/doctors?page=${page}&limit=10`);
      const data: DoctorsResponse = await response.json();
      setDoctors(data.doctors.data);
      setTotal(data.doctors.total);
      setTotalPages(data.doctors.totalPages);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth, page]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const response = await fetchWithAuth('/api/doctors', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create doctor');
      }

      setFormData({ name: '' });
      setShowForm(false);
      fetchDoctors();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to create doctor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;

    try {
      const response = await fetchWithAuth(`/api/doctors/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete doctor');
      }

      fetchDoctors();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete doctor');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Doctors</h1>
          <p className="text-slate-500 mt-1">Manage healthcare providers</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Doctor'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Add New Doctor</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{formError}</span>
              </div>
            )}
            <div className="max-w-md">
              <Input
                label="Doctor Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Dr. Smith"
                required
              />
            </div>
            <Button type="submit" isLoading={isSubmitting}>
              Create Doctor
            </Button>
          </form>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <p className="text-sm font-medium text-slate-600">
            Total: <span className="text-slate-800">{total} doctors</span>
          </p>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-slate-500">No doctors found</p>
            <p className="text-sm text-slate-400 mt-1">Add your first doctor to get started</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {doctors.map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-emerald-600">
                              {doctor.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-slate-800">{doctor.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-sm">
                        {new Date(doctor.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button
                          variant="danger"
                          onClick={() => handleDelete(doctor.id)}
                          className="text-xs py-1.5 px-3"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 px-6 py-4 border-t border-slate-200 bg-slate-50">
                <Button
                  variant="secondary"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="text-sm"
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-600">
                  Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                </span>
                <Button
                  variant="secondary"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="text-sm"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
