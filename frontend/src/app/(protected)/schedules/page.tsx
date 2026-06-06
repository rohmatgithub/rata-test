'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button, Input, Card } from '@/components';
import { useApi } from '@/hooks/useApi';

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface Doctor {
  id: string;
  name: string;
}

interface Schedule {
  id: string;
  objective: string;
  scheduledAt: string;
  duration: number;
  customer: Customer;
  doctor: Doctor;
  createdAt: string;
}

interface SchedulesResponse {
  schedules: {
    data: Schedule[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    objective: '',
    customerId: '',
    doctorId: '',
    scheduledAt: '',
    duration: 30,
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchWithAuth } = useApi();

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithAuth(`/api/schedules?page=${page}&limit=10`);
      const data: SchedulesResponse = await response.json();
      setSchedules(data.schedules.data);
      setTotal(data.schedules.total);
      setTotalPages(data.schedules.totalPages);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth, page]);

  const fetchOptions = useCallback(async () => {
    try {
      const [customersRes, doctorsRes] = await Promise.all([
        fetchWithAuth('/api/customers?limit=100'),
        fetchWithAuth('/api/doctors?limit=100'),
      ]);

      const customersData = await customersRes.json();
      const doctorsData = await doctorsRes.json();

      setCustomers(customersData.customers?.data || []);
      setDoctors(doctorsData.doctors?.data || []);
    } catch (error) {
      console.error('Failed to fetch options:', error);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    fetchSchedules();
    fetchOptions();
  }, [fetchSchedules, fetchOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const response = await fetchWithAuth('/api/schedules', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create schedule');
      }

      setFormData({
        objective: '',
        customerId: '',
        doctorId: '',
        scheduledAt: '',
        duration: 30,
      });
      setShowForm(false);
      fetchSchedules();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to create schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const response = await fetchWithAuth(`/api/schedules/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete schedule');
      }

      fetchSchedules();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete schedule');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Schedules</h1>
          <p className="text-slate-500 mt-1">Manage appointments and schedules</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Create Schedule'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Create New Schedule</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{formError}</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Customer
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-slate-400 transition-all duration-200"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Doctor
                </label>
                <select
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-slate-400 transition-all duration-200"
                  required
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Objective"
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                placeholder="General Checkup"
                required
              />
              <Input
                label="Date & Time"
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                required
              />
              <Input
                label="Duration (minutes)"
                type="number"
                min={15}
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                required
              />
            </div>
            <Button type="submit" isLoading={isSubmitting}>
              Create Schedule
            </Button>
          </form>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <p className="text-sm font-medium text-slate-600">
            Total: <span className="text-slate-800">{total} schedules</span>
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
        ) : schedules.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-slate-500">No schedules found</p>
            <p className="text-sm text-slate-400 mt-1">Create your first schedule to get started</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Objective
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {schedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <span className="font-medium text-slate-800">{schedule.objective}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {schedule.customer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {schedule.doctor.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-sm">
                        {formatDateTime(schedule.scheduledAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {schedule.duration} min
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button
                          variant="danger"
                          onClick={() => handleDelete(schedule.id)}
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
