// src/components/finance/FinanceDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  DollarSign, CreditCard, Users, TrendingUp, TrendingDown,
  Search, Filter, Download, Calendar, Clock, AlertCircle,
  CheckCircle, XCircle, Loader, RefreshCw, Eye, Edit,
  Plus, Minus, ChevronRight, ChevronLeft, FileText,
  Printer, Mail, Phone, Home, Award, Shield,
  BarChart3, PieChart, Activity, Target, Zap
} from 'lucide-react';
import { db, auth } from '../../firebase/config';
import {
  collection, query, where, getDocs, doc, getDoc,
  updateDoc, addDoc, serverTimestamp, orderBy,
  limit, startAfter, getCountFromServer, writeBatch,
  deleteDoc, setDoc
} from 'firebase/firestore';
import { Sidebar } from '../dashboard/Sidebar';
import { TopHeader } from '../dashboard/TopHeader';
import { StatsCard } from '../dashboard/StatsCard';
import { LoadingState } from '../dashboard/LoadingState';
import { EmptyState } from '../dashboard/EmptyState';

const FinanceDashboard = ({ currentUser }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddFeeModal, setShowAddFeeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [feeData, setFeeData] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    totalFees: 0,
    totalPaid: 0,
    outstanding: 0,
    collectionRate: 0
  });

  // Fee form state
  const [feeForm, setFeeForm] = useState({
    studentId: '',
    studentName: '',
    amount: '',
    dueDate: '',
    term: 'Term 1',
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    type: 'tuition',
    status: 'pending',
    notes: ''
  });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    amount: '',
    paymentMethod: 'cash',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const paymentMethods = ['cash', 'bank_transfer', 'ecocash', 'innbucks', 'cheque', 'credit_card'];
  const feeTypes = ['tuition', 'registration', 'sports', 'technology', 'transport', 'other'];
  const terms = ['Term 1', 'Term 2', 'Term 3'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStudents(),
        fetchFeeData(),
        fetchTransactions(),
        fetchPaymentHistory()
      ]);
      calculateSummary();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    const snapshot = await getDocs(query(collection(db, 'students'), where('isEnrolled', '==', true)));
    const studentsList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }));
    setStudents(studentsList);
  };

  const fetchFeeData = async () => {
    const snapshot = await getDocs(collection(db, 'fees'));
    const fees = {};
    snapshot.forEach(doc => {
      fees[doc.id] = {
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
      };
    });
    setFeeData(fees);
  };

  const fetchTransactions = async () => {
    const snapshot = await getDocs(query(
      collection(db, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(100)
    ));
    const transactionsList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }));
    setTransactions(transactionsList);
  };

  const fetchPaymentHistory = async () => {
    const snapshot = await getDocs(query(
      collection(db, 'paymentHistory'),
      orderBy('date', 'desc'),
      limit(50)
    ));
    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate?.() || new Date(doc.data().date)
    }));
    setPaymentHistory(payments);
  };

  const calculateSummary = () => {
    const totalStudents = students.length;
    let totalFees = 0;
    let totalPaid = 0;

    Object.values(feeData).forEach(fee => {
      totalFees += fee.amount || 0;
      totalPaid += fee.paid || 0;
    });

    const outstanding = totalFees - totalPaid;
    const collectionRate = totalFees > 0 ? (totalPaid / totalFees) * 100 : 0;

    setSummary({
      totalStudents,
      totalFees,
      totalPaid,
      outstanding,
      collectionRate
    });
  };

  const handleAddFee = async () => {
    if (!feeForm.studentId || !feeForm.amount || !feeForm.dueDate) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const student = students.find(s => s.id === feeForm.studentId);
      
      const feeData = {
        studentId: feeForm.studentId,
        studentName: student?.fullName || feeForm.studentName,
        amount: parseFloat(feeForm.amount),
        dueDate: new Date(feeForm.dueDate),
        term: feeForm.term,
        academicYear: feeForm.academicYear,
        type: feeForm.type,
        status: 'pending',
        paid: 0,
        balance: parseFloat(feeForm.amount),
        notes: feeForm.notes,
        createdBy: currentUser?.uid,
        createdByName: currentUser?.name || 'Finance',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'fees'), feeData);

      // Create transaction record
      await addDoc(collection(db, 'transactions'), {
        type: 'fee_created',
        studentId: feeForm.studentId,
        studentName: student?.fullName || feeForm.studentName,
        amount: parseFloat(feeForm.amount),
        description: `${feeForm.type} fee for ${feeForm.term}`,
        performedBy: currentUser?.uid,
        performedByName: currentUser?.name || 'Finance',
        createdAt: serverTimestamp()
      });

      alert('✅ Fee added successfully!');
      setShowAddFeeModal(false);
      resetFeeForm();
      fetchData();
    } catch (error) {
      console.error('Error adding fee:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.studentId || !paymentForm.amount) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const student = students.find(s => s.id === paymentForm.studentId);
      const amount = parseFloat(paymentForm.amount);

      // Update fee record
      const feeId = paymentForm.studentId; // Using studentId as fee ID
      const feeRef = doc(db, 'fees', feeId);
      const feeDoc = await getDoc(feeRef);
      
      let currentPaid = 0;
      let currentBalance = 0;
      let feeStatus = 'pending';

      if (feeDoc.exists()) {
        const feeData = feeDoc.data();
        currentPaid = feeData.paid || 0;
        currentBalance = feeData.balance || feeData.amount;
        const newPaid = currentPaid + amount;
        const newBalance = currentBalance - amount;
        feeStatus = newBalance <= 0 ? 'paid' : 'partial';
        
        await updateDoc(feeRef, {
          paid: newPaid,
          balance: newBalance,
          status: feeStatus,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create fee record if doesn't exist
        await setDoc(feeRef, {
          studentId: paymentForm.studentId,
          studentName: student?.fullName,
          amount: amount,
          paid: amount,
          balance: 0,
          status: 'paid',
          createdBy: currentUser?.uid,
          createdByName: currentUser?.name || 'Finance',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // Record payment
      await addDoc(collection(db, 'paymentHistory'), {
        studentId: paymentForm.studentId,
        studentName: student?.fullName || 'Unknown',
        amount: amount,
        paymentMethod: paymentForm.paymentMethod,
        reference: paymentForm.reference || `PAY-${Date.now()}`,
        date: new Date(paymentForm.date),
        notes: paymentForm.notes,
        recordedBy: currentUser?.uid,
        recordedByName: currentUser?.name || 'Finance',
        createdAt: serverTimestamp()
      });

      // Create transaction
      await addDoc(collection(db, 'transactions'), {
        type: 'payment_received',
        studentId: paymentForm.studentId,
        studentName: student?.fullName || 'Unknown',
        amount: amount,
        paymentMethod: paymentForm.paymentMethod,
        description: `Payment received via ${paymentForm.paymentMethod}`,
        performedBy: currentUser?.uid,
        performedByName: currentUser?.name || 'Finance',
        createdAt: serverTimestamp()
      });

      alert(`✅ Payment of $${amount.toFixed(2)} recorded successfully!`);
      setShowPaymentModal(false);
      resetPaymentForm();
      fetchData();
    } catch (error) {
      console.error('Error recording payment:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetFeeForm = () => {
    setFeeForm({
      studentId: '',
      studentName: '',
      amount: '',
      dueDate: '',
      term: 'Term 1',
      academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      type: 'tuition',
      status: 'pending',
      notes: ''
    });
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      studentId: '',
      amount: '',
      paymentMethod: 'cash',
      reference: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return 'bg-emerald-100 text-emerald-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'paid': return 'Paid';
      case 'partial': return 'Partial';
      case 'overdue': return 'Overdue';
      default: return 'Pending';
    }
  };

  // Overview Section
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Students"
          value={summary.totalStudents}
          icon={Users}
          color="from-blue-500 to-blue-600"
          subtitle="Active students"
          details={[
            { label: 'Enrolled', value: students.filter(s => s.isEnrolled).length }
          ]}
        />
        <StatsCard
          title="Total Fees"
          value={`$${summary.totalFees.toLocaleString()}`}
          icon={DollarSign}
          color="from-emerald-500 to-emerald-600"
          subtitle="All outstanding fees"
          details={[
            { label: 'Outstanding', value: `$${summary.outstanding.toLocaleString()}` }
          ]}
        />
        <StatsCard
          title="Total Paid"
          value={`$${summary.totalPaid.toLocaleString()}`}
          icon={CreditCard}
          color="from-purple-500 to-purple-600"
          subtitle="Payments received"
          details={[
            { label: 'Collection Rate', value: `${summary.collectionRate.toFixed(1)}%` }
          ]}
        />
        <StatsCard
          title="Outstanding"
          value={`$${summary.outstanding.toLocaleString()}`}
          icon={AlertCircle}
          color="from-orange-500 to-orange-600"
          subtitle="Pending payments"
          details={[
            { label: 'Overdue', value: Object.values(feeData).filter(f => f.status === 'overdue').length }
          ]}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setShowAddFeeModal(true)}
          className="p-6 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-white hover:shadow-lg transition-all"
        >
          <Plus className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">Add Fee</h3>
          <p className="text-sm opacity-90">Create new fee record for a student</p>
        </button>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white hover:shadow-lg transition-all"
        >
          <CreditCard className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">Record Payment</h3>
          <p className="text-sm opacity-90">Log a payment from a student</p>
        </button>
        <button
          onClick={() => setActiveSection('students')}
          className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl text-white hover:shadow-lg transition-all"
        >
          <Users className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">View Students</h3>
          <p className="text-sm opacity-90">See all student fee statuses</p>
        </button>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
            <p className="text-sm text-gray-500">Latest financial activities</p>
          </div>
          <button
            onClick={() => setActiveSection('transactions')}
            className="text-sm text-emerald-600 hover:text-emerald-800"
          >
            View All →
          </button>
        </div>
        <div className="space-y-3">
          {transactions.slice(0, 5).map(transaction => (
            <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  transaction.type === 'payment_received' ? 'bg-emerald-100' :
                  transaction.type === 'fee_created' ? 'bg-blue-100' :
                  'bg-purple-100'
                }`}>
                  {transaction.type === 'payment_received' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                  {transaction.type === 'fee_created' && <Plus className="w-5 h-5 text-blue-600" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{transaction.studentName}</p>
                  <p className="text-sm text-gray-500">{transaction.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  transaction.type === 'payment_received' ? 'text-emerald-600' : 'text-blue-600'
                }`}>
                  {transaction.type === 'payment_received' ? '+' : ''}${transaction.amount?.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">{transaction.createdAt?.toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Students Section with Fees
  const renderStudents = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Fee Management</h2>
          <p className="text-gray-600">View and manage student fee records</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddFeeModal(true)}
            className="px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Fee
          </button>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <Loader className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
            <p className="mt-2 text-gray-600">Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">Student</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">Student ID</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">Total Fees</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">Paid</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">Balance</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(student => {
                  const fee = feeData[student.id];
                  const total = fee?.amount || 0;
                  const paid = fee?.paid || 0;
                  const balance = fee?.balance || total;
                  const status = fee?.status || 'pending';

                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {student.fullName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{student.fullName}</div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <code className="font-mono text-sm">{student.studentId}</code>
                      </td>
                      <td className="py-4 px-6 font-medium">${total.toFixed(2)}</td>
                      <td className="py-4 px-6 text-emerald-600 font-medium">${paid.toFixed(2)}</td>
                      <td className="py-4 px-6 font-medium">${balance.toFixed(2)}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {getStatusText(status)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setFeeForm({
                                ...feeForm,
                                studentId: student.id,
                                studentName: student.fullName,
                                amount: fee?.amount || '',
                                dueDate: fee?.dueDate?.toISOString().split('T')[0] || '',
                                term: fee?.term || 'Term 1',
                                type: fee?.type || 'tuition',
                                notes: fee?.notes || ''
                              });
                              setShowAddFeeModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit Fee"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setPaymentForm({
                                ...paymentForm,
                                studentId: student.id
                              });
                              setShowPaymentModal(true);
                            }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Record Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // Transactions Section
  const renderTransactions = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
        <p className="text-gray-600">Complete log of all financial transactions</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {transactions.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map(transaction => (
              <div key={transaction.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'payment_received' ? 'bg-emerald-100' :
                      transaction.type === 'fee_created' ? 'bg-blue-100' :
                      'bg-purple-100'
                    }`}>
                      {transaction.type === 'payment_received' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                      {transaction.type === 'fee_created' && <Plus className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.studentName}</p>
                      <p className="text-sm text-gray-500">{transaction.description}</p>
                      <p className="text-xs text-gray-400">
                        {transaction.performedByName} • {transaction.createdAt?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'payment_received' ? 'text-emerald-600' : 'text-blue-600'
                    }`}>
                      {transaction.type === 'payment_received' ? '+' : ''}${transaction.amount?.toFixed(2)}
                    </p>
                    {transaction.paymentMethod && (
                      <p className="text-xs text-gray-400 capitalize">{transaction.paymentMethod}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render content based on active section
  const renderContent = () => {
    switch(activeSection) {
      case 'students':
        return renderStudents();
      case 'transactions':
        return renderTransactions();
      default:
        return renderOverview();
    }
  };

  // Add Fee Modal
  const AddFeeModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Fee</h2>
            <p className="text-sm text-gray-500">Create a new fee record for a student</p>
          </div>
          <button onClick={() => setShowAddFeeModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
            <XCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Student *</label>
            <select
              value={feeForm.studentId}
              onChange={(e) => {
                const student = students.find(s => s.id === e.target.value);
                setFeeForm({
                  ...feeForm,
                  studentId: e.target.value,
                  studentName: student?.fullName || ''
                });
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
            >
              <option value="">Select a student...</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.fullName} ({student.studentId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
            <input
              type="number"
              value={feeForm.amount}
              onChange={(e) => setFeeForm({...feeForm, amount: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
              placeholder="e.g., 500"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
            <input
              type="date"
              value={feeForm.dueDate}
              onChange={(e) => setFeeForm({...feeForm, dueDate: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
              <select
                value={feeForm.term}
                onChange={(e) => setFeeForm({...feeForm, term: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
              >
                {terms.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fee Type</label>
              <select
                value={feeForm.type}
                onChange={(e) => setFeeForm({...feeForm, type: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
              >
                {feeTypes.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={feeForm.notes}
              onChange={(e) => setFeeForm({...feeForm, notes: e.target.value})}
              rows="2"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => setShowAddFeeModal(false)}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddFee}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Add Fee'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Payment Modal
  const PaymentModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
            <p className="text-sm text-gray-500">Log a payment from a student</p>
          </div>
          <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
            <XCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Student *</label>
            <select
              value={paymentForm.studentId}
              onChange={(e) => {
                setPaymentForm({
                  ...paymentForm,
                  studentId: e.target.value
                });
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
            >
              <option value="">Select a student...</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.fullName} ({student.studentId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
            <input
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
              placeholder="e.g., 500"
              min="0.01"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <select
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
            >
              {paymentMethods.map(method => (
                <option key={method} value={method}>
                  {method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reference</label>
            <input
              type="text"
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
              placeholder="Payment reference number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={paymentForm.date}
              onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
              rows="2"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRecordPayment}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Record Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const username = currentUser?.name || currentUser?.email?.split('@')[0] || 'Finance';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        userType="finance"
        userName={username}
        userRole="Finance Officer"
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        sections={[
          { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-5 h-5" /> },
          { id: 'students', label: 'Student Fees', icon: <Users className="w-5 h-5" /> },
          { id: 'transactions', label: 'Transactions', icon: <FileText className="w-5 h-5" /> },
        ]}
      />

      <TopHeader
        title={activeSection === 'overview' ? 'Finance Dashboard' : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
        subtitle="Manage student fees and payments"
        userName={username}
        userRole="Finance Officer"
        onSearch={(query) => setSearchQuery(query)}
        onNotificationsClick={() => console.log('Notifications')}
        onSettingsClick={() => console.log('Settings')}
        onMenuClick={() => setSidebarCollapsed(false)}
        notificationCount={Object.values(feeData).filter(f => f.status === 'overdue').length}
      />

      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} px-6 py-8`}>
        {renderContent()}
      </main>

      {/* Add Fee Modal */}
      {showAddFeeModal && <AddFeeModal />}

      {/* Payment Modal */}
      {showPaymentModal && <PaymentModal />}
    </div>
  );
};

export default FinanceDashboard;