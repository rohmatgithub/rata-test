'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components';
import { useApi } from '@/hooks/useApi';

interface Stats {
  customers: number;
  doctors: number;
  schedules: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ customers: 0, doctors: 0, schedules: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { fetchWithAuth } = useApi();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [customersRes, doctorsRes, schedulesRes] = await Promise.all([
          fetchWithAuth('/api/customers?limit=1'),
          fetchWithAuth('/api/doctors?limit=1'),
          fetchWithAuth('/api/schedules?limit=1'),
        ]);

        const customers = await customersRes.json();
        const doctors = await doctorsRes.json();
        const schedules = await schedulesRes.json();

        setStats({
          customers: customers.customers?.total || 0,
          doctors: doctors.doctors?.total || 0,
          schedules: schedules.schedules?.total || 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [fetchWithAuth]);

  const statCards = [
    {
      label: 'Total Customers',
      value: stats.customers,
      href: '/customers',
      bgColor: 'bg-blue-500',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
    },
    {
      label: 'Total Doctors',
      value: stats.doctors,
      href: '/doctors',
      bgColor: 'bg-emerald-500',
      icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      label: 'Total Schedules',
      value: stats.schedules,
      href: '/schedules',
      bgColor: 'bg-violet-500',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back! Here&apos;s your overview.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse border border-slate-100">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
              <div className="h-10 bg-slate-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-800 mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                    </svg>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/customers"
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 transition-colors text-slate-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Add New Customer
            </Link>
            <Link
              href="/doctors"
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-slate-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Add New Doctor
            </Link>
            <Link
              href="/schedules"
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-violet-50 hover:text-violet-700 transition-colors text-slate-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Schedule
            </Link>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium text-slate-600">Auth Service</span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium text-slate-600">Schedule Service</span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium text-slate-600">Notification Service</span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Active
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
