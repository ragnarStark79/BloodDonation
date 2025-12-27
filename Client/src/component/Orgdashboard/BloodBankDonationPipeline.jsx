import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, CheckCircle, Droplet, Search, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import adminApi from '../../api/adminApi';
import orgApi from '../../api/orgApi';
import ScreeningFormModal from './ScreeningFormModal';
import DonorDetailsModal from './DonorDetailsModal';
import BloodCollectionModal from './BloodCollectionModal';
import LabTestingModal from './LabTestingModal';

const BloodBankDonationPipeline = () => {
    const { user } = useAuth();
    const [donationColumns, setDonationColumns] = useState({
        'new-donors': {
            id: 'new-donors',
            title: 'NEW DONORS',
            color: 'from-red-50 to-red-100/50',
            items: []
        },
        'screening': {
            id: 'screening',
            title: 'SCREENING',
            color: 'from-blue-50 to-blue-100/50',
            items: []
        },
        'in-progress': {
            id: 'in-progress',
            title: 'IN PROGRESS',
            color: 'from-yellow-50 to-yellow-100/50',
            items: []
        },
        'completed': {
            id: 'completed',
            title: 'COMPLETED',
            color: 'from-green-50 to-green-100/50',
            items: []
        },
        'ready-storage': {
            id: 'ready-storage',
            title: 'READY FOR STORAGE',
            color: 'from-purple-50 to-purple-100/50',
            items: []
        }
    });

    const [showAddDonationModal, setShowAddDonationModal] = useState(false);
    const [showScreeningModal, setShowScreeningModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [showLabTestModal, setShowLabTestModal] = useState(false);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pipelineStats, setPipelineStats] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [donorSearchTerm, setDonorSearchTerm] = useState('');
    const [donorSearchResults, setDonorSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [emailExists, setEmailExists] = useState(null);
    const [phoneExists, setPhoneExists] = useState(null);
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [checkingPhone, setCheckingPhone] = useState(false);
    const [newDonation, setNewDonation] = useState({
        donorName: '',
        bloodGroup: 'O+',
        phone: '',
        email: '',
        notes: ''
    });

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    useEffect(() => {
        fetchDonations();
        fetchStats();
    }, []);

    const fetchDonations = async () => {
        try {
            // Fetch appointments and donations
            const [appointmentsData, donationsData] = await Promise.all([
                orgApi.getAppointments(),
                adminApi.getDonations().catch(() => ({ 'new-donors': { items: [] }, 'screening': { items: [] }, 'in-progress': { items: [] }, 'completed': { items: [] }, 'ready-storage': { items: [] } }))
            ]);

            // Handle both response formats for appointments
            const appointmentsArray = Array.isArray(appointmentsData)
                ? appointmentsData
                : (appointmentsData.appointments || []);



            // Collect all ids that already have donations to avoid duplicates
            // Handle both grouped object and flat array (though backend returns grouped)
            const existingDonationIds = new Set();

            const donationsByStage = Array.isArray(donationsData) ?
                donationsData.reduce((acc, d) => {
                    const st = d.stage || 'new-donors';
                    if (!acc[st]) acc[st] = { id: st, items: [] };
                    acc[st].items.push(d);
                    return acc;
                }, {}) : donationsData;

            Object.values(donationsByStage || {}).forEach(stage => {
                if (stage && stage.items) {
                    stage.items.forEach(item => {
                        if (item.appointmentId) existingDonationIds.add(item.appointmentId.toString());
                        if (item.campParticipantId) existingDonationIds.add(item.campParticipantId);
                    });
                }
            });


            // Convert UPCOMING appointments to NEW DONORS
            // User feedback: "user will come in new donar when time is 9"
            // We only show them once the appointment time has arrived or passed
            // IMPORTANT: Exclude appointments that have been completed/collected to prevent duplicates
            const upcomingAppointments = appointmentsArray
                .filter(apt => {
                    const status = (apt.status || '').toUpperCase();
                    const aptId = apt._id?.toString() || apt.id?.toString();
                    const notExisting = !existingDonationIds.has(aptId);

                    const apptTime = new Date(apt.dateTime);
                    const isArrived = apptTime <= new Date();

                    // Exclude appointments that have been processed (completed, collected, rejected, cancelled)
                    const isProcessed = ['COLLECTED', 'COMPLETED', 'REJECTED', 'CANCELLED'].includes(status);

                    if (isProcessed) {
                        return false; // Don't show processed appointments
                    }

                    // Only show UPCOMING appointments that have arrived and don't have donations yet
                    const isUpcoming = status === 'UPCOMING';
                    return isUpcoming && notExisting && isArrived;
                })
                .map(apt => ({
                    id: apt._id || apt.id,
                    _id: apt._id || apt.id,
                    donorId: apt.donorId?._id || apt.donorId,
                    name: apt.donorId?.Name || 'Unknown Donor',
                    group: apt.donorId?.bloodGroup || apt.bloodGroup || 'Unknown',
                    phone: apt.donorId?.PhoneNumber || apt.donorId?.Phone || apt.donorId?.phone || 'Not provided',
                    email: apt.donorId?.Email || apt.donorId?.email || 'Not provided',
                    date: apt.dateTime || apt.createdAt || new Date(),
                    appointmentDate: apt.dateTime,
                    isToday: new Date(apt.dateTime).toDateString() === new Date().toDateString(),
                    requestId: apt.requestId?._id || apt.requestId,
                    notes: apt.notes || `Appointment on ${new Date(apt.dateTime || Date.now()).toLocaleDateString()}`,
                    stage: 'new-donors',
                    status: 'Active',
                    appointmentId: apt._id || apt.id,
                    fromAppointment: true
                }));


            // Add isToday flag to all existing donations from backend
            Object.keys(donationsByStage).forEach(stage => {
                if (donationsByStage[stage].items) {
                    donationsByStage[stage].items = donationsByStage[stage].items.map(item => ({
                        ...item,
                        isToday: item.date ? new Date(item.date).toDateString() === new Date().toDateString() : false
                    }));
                }
            });

            // Merge everything into columns
            // Camp participants will only appear when they have appointments (not directly)
            const newColumns = {
                'new-donors': {
                    id: 'new-donors',
                    title: 'NEW DONORS',
                    color: 'from-red-50 to-red-100/50',
                    items: [...upcomingAppointments, ...(donationsByStage['new-donors']?.items || [])]
                },
                'screening': donationsByStage['screening'] || { id: 'screening', title: 'SCREENING', color: 'from-blue-50 to-blue-100/50', items: [] },
                'in-progress': donationsByStage['in-progress'] || { id: 'in-progress', title: 'IN PROGRESS', color: 'from-yellow-50 to-yellow-100/50', items: [] },
                'completed': donationsByStage['completed'] || { id: 'completed', title: 'COMPLETED', color: 'from-green-50 to-green-100/50', items: [] },
                'ready-storage': donationsByStage['ready-storage'] || { id: 'ready-storage', title: 'READY FOR STORAGE', color: 'from-purple-50 to-purple-100/50', items: [] }
            };

            setDonationColumns(newColumns);
        } catch (error) {
            console.error('Failed to fetch donations:', error);
            toast.error('Failed to load donation pipeline');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const stats = await orgApi.getDonationStats();
            setPipelineStats(stats);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    // Search for existing donors
    const searchDonors = async (query) => {
        if (!query || query.length < 2) {
            setDonorSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const response = await adminApi.getUsers({ search: query, role: 'donor', limit: 5 });
            setDonorSearchResults(response.users || []);
        } catch (error) {
            console.error('Failed to search donors:', error);
            setDonorSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchDonors(donorSearchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [donorSearchTerm]);

    // Select donor from search results
    const selectDonor = (donor) => {
        setNewDonation({
            donorName: donor.Name || '',
            bloodGroup: donor.bloodGroup || 'O+',
            phone: donor.Phone || '',
            email: donor.Email || '',
            notes: `Existing donor - Last donation: ${donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString() : 'Never'}`
        });
        setDonorSearchTerm(donor.Name || '');
        setDonorSearchResults([]);
        setEmailExists(null);
        setPhoneExists(null);
    };

    // Check if email exists
    const checkEmail = async (email) => {
        if (!email || email.length < 5 || !email.includes('@')) {
            setEmailExists(null);
            return;
        }

        setCheckingEmail(true);
        try {
            const response = await adminApi.getUsers({ search: email, role: 'donor', limit: 1 });
            const existingDonor = response.users?.find(u => u.Email?.toLowerCase() === email.toLowerCase());
            setEmailExists(existingDonor || null);
        } catch (error) {
            console.error('Failed to check email:', error);
            setEmailExists(null);
        } finally {
            setCheckingEmail(false);
        }
    };

    // Check if phone exists
    const checkPhone = async (phone) => {
        if (!phone || phone.length < 10) {
            setPhoneExists(null);
            return;
        }

        setCheckingPhone(true);
        try {
            const response = await adminApi.getUsers({ search: phone, role: 'donor', limit: 1 });
            const existingDonor = response.users?.find(u => u.Phone === phone);
            setPhoneExists(existingDonor || null);
        } catch (error) {
            console.error('Failed to check phone:', error);
            setPhoneExists(null);
        } finally {
            setCheckingPhone(false);
        }
    };

    // Debounced email check
    useEffect(() => {
        const timer = setTimeout(() => {
            checkEmail(newDonation.email);
        }, 500);
        return () => clearTimeout(timer);
    }, [newDonation.email]);

    // Debounced phone check
    useEffect(() => {
        const timer = setTimeout(() => {
            checkPhone(newDonation.phone);
        }, 500);
        return () => clearTimeout(timer);
    }, [newDonation.phone]);

    const handleAddDonation = async () => {
        const { donorName, bloodGroup, phone, email, notes } = newDonation;

        if (!donorName || !bloodGroup) {
            toast.error('Donor name and blood group are required');
            return;
        }

        // Check if we're using an existing donor
        const existingDonor = emailExists || phoneExists;

        try {
            const donationData = {
                donorName,
                bloodGroup,
                phone,
                email,
                notes,
                organizationId: user._id
            };

            // If existing donor found, link their donor ID
            if (existingDonor) {
                donationData.donorId = existingDonor._id;
                donationData.notes = `${notes}\n[Linked to existing donor: ${existingDonor.Name}]`.trim();
            }

            await adminApi.createDonation(donationData);

            if (existingDonor) {
                toast.success(`Donation created for existing donor: ${existingDonor.Name}`);
            } else {
                toast.success('New donor registered successfully!');
            }

            setShowAddDonationModal(false);
            setNewDonation({
                donorName: '',
                bloodGroup: 'O+',
                phone: '',
                email: '',
                notes: ''
            });
            setDonorSearchTerm('');
            setDonorSearchResults([]);
            setEmailExists(null);
            setPhoneExists(null);
            await fetchDonations();
            fetchStats(); // Refresh stats after adding donation
        } catch (error) {
            console.error('Failed to create donation:', error);
            toast.error('Failed to register donor');
        }
    };

    const onDragEndDonation = async (result) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        const sourceCol = donationColumns[source.droppableId];
        const destCol = donationColumns[destination.droppableId];

        if (!sourceCol || !destCol) {
            console.error('Invalid columns:', { sourceCol, destCol, donationColumns });
            toast.error('Invalid drag operation');
            return;
        }

        if (!sourceCol.items || !destCol.items) {
            console.error('Missing items array:', { sourceCol, destCol });
            toast.error('Invalid column data');
            return;
        }

        const draggedItem = sourceCol.items[source.index];

        if (!draggedItem) {
            console.error('Dragged item not found at index:', source.index);
            toast.error('Item not found');
            return;
        }

        // Optimistic update
        const newSourceItems = Array.from(sourceCol.items);
        newSourceItems.splice(source.index, 1);

        const newDestItems = Array.from(destCol.items);
        newDestItems.splice(destination.index, 0, draggedItem);

        const newColumns = {
            ...donationColumns,
            [source.droppableId]: {
                ...sourceCol,
                items: newSourceItems,
            },
            [destination.droppableId]: {
                ...destCol,
                items: newDestItems,
            },
        };
        setDonationColumns(newColumns);

        // Call backend API
        try {
            const movedItem = sourceCol.items[source.index];

            // Check if this is an appointment or camp participant being moved (from NEW DONORS)
            if ((movedItem.fromAppointment || movedItem.fromCamp) && source.droppableId === 'new-donors') {

                // Create a donation record
                const donationData = {
                    donorName: movedItem.name,
                    bloodGroup: movedItem.group,
                    phone: movedItem.phone,
                    email: movedItem.email,
                    notes: movedItem.notes,
                    organizationId: user._id || user.userId
                };

                if (movedItem.fromAppointment) {
                    donationData.appointmentId = movedItem.appointmentId || movedItem._id;
                    donationData.donorId = movedItem.donorId;
                } else if (movedItem.fromCamp) {
                    donationData.campId = movedItem.campId;
                    donationData.campParticipantId = movedItem.campParticipantId;
                    donationData.donorId = movedItem.donorId;
                }

                try {
                    const newDonation = await adminApi.createDonation(donationData);
                    const donationId = newDonation._id || newDonation.donation?._id || newDonation.donation?.id || newDonation.id;

                    if (!donationId) throw new Error('Donation created but no ID returned');

                    // Now update the donation stage to destination
                    await adminApi.updateDonationStage(donationId, destination.droppableId, user._id || user.userId);
                    toast.success(`Moved to ${destCol.title}`);
                } catch (createError) {
                    if (createError.response?.status === 400 && createError.response?.data?.message?.includes('already exists')) {
                        toast.info('Donation already exists, syncing...');
                        await fetchDonations();
                        return;
                    }
                    throw createError;
                }
            } else {
                // Regular donation move
                const donationId = draggableId;
                await adminApi.updateDonationStage(donationId, destination.droppableId, user.userId);
                toast.success(`Moved to ${destCol.title}`);
            }

            await fetchDonations();
            fetchStats(); // Refresh stats after move
        } catch (error) {
            console.error('Failed to update donation stage:', error);
            toast.error('Failed to move donation. Changes reverted.');
            setDonationColumns(donationColumns);
        }
    };

    const handleCardClick = (item, columnId) => {
        // Close all modals first to ensure only one shows
        setShowDetailsModal(false);
        setShowScreeningModal(false);
        setShowCollectionModal(false);
        setShowLabTestModal(false);

        // Set the selected donation
        setSelectedDonation(item);

        // Open the appropriate modal based on column
        if (columnId === 'new-donors') {
            setShowDetailsModal(true);
        } else if (columnId === 'screening') {
            setShowScreeningModal(true);
        } else if (columnId === 'in-progress') {
            setShowCollectionModal(true);
        } else if (columnId === 'completed') {
            setShowLabTestModal(true);
        } else if (columnId === 'ready-storage') {
            setShowDetailsModal(true);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Donation Pipeline</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Track donations through all 5 stages from registration to storage
                    </p>
                </div>
                <button
                    onClick={() => setShowAddDonationModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Donation
                </button>
            </div>

            {/* Stats Summary Bar */}
            {pipelineStats && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{pipelineStats.totalInPipeline || 0}</div>
                            <div className="text-xs text-gray-600 font-medium">Total in Pipeline</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{pipelineStats.today || 0}</div>
                            <div className="text-xs text-gray-600 font-medium">Today</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{pipelineStats.thisWeek || 0}</div>
                            <div className="text-xs text-gray-600 font-medium">This Week</div>
                        </div>
                        <div className="text-center">
                            <div className={`text-2xl font-bold ${pipelineStats.successRate >= 90 ? 'text-green-600' : pipelineStats.successRate >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {pipelineStats.successRate || 0}%
                            </div>
                            <div className="text-xs text-gray-600 font-medium">Success Rate</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">{pipelineStats.completedToday || 0}</div>
                            <div className="text-xs text-gray-600 font-medium">Completed Today</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                <DragDropContext onDragEnd={onDragEndDonation}>
                    {Object.values(donationColumns).map((col) => (
                        <Droppable key={col.id} droppableId={col.id}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`flex flex-col rounded-2xl p-2 min-h-[400px] border ${snapshot.isDraggingOver ? 'border-blue-200' : 'border-gray-100'} bg-gradient-to-br ${col.color}`}
                                >
                                    <div className="flex items-center justify-between p-3">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {col.title}
                                        </h4>
                                        <span className="text-xs font-bold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-md shadow-sm">
                                            {col.items.length}
                                        </span>
                                    </div>
                                    <div className="flex-1 space-y-3 p-1">
                                        {col.items.map((it, idx) => (
                                            <Draggable key={it.id} draggableId={it.id} index={idx}>
                                                {(pr) => (
                                                    <div
                                                        ref={pr.innerRef}
                                                        {...pr.draggableProps}
                                                        {...pr.dragHandleProps}
                                                        onClick={() => handleCardClick(it, col.id)}
                                                        className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group ${col.id === 'screening' ? 'hover:border-blue-300' :
                                                            col.id === 'new-donors' ? 'hover:border-red-300' : ''
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div
                                                                style={{
                                                                    background: `linear-gradient(135deg, #ef4444 0%, #dc2626 100%)`,
                                                                }}
                                                                className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm shadow-sm"
                                                            >
                                                                {it.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <p className="font-bold text-sm text-gray-800 truncate">
                                                                        {it.name}
                                                                    </p>
                                                                    {it.isToday && (
                                                                        <span className="text-[9px] bg-red-100 text-red-700 font-black px-1.5 py-0.5 rounded ml-2 uppercase tracking-tighter shadow-sm border border-red-200">Today</span>
                                                                    )}
                                                                    {it.fromCamp && (
                                                                        <span className="text-[9px] bg-purple-100 text-purple-700 font-black px-1.5 py-0.5 rounded ml-2 uppercase tracking-tighter">Camp</span>
                                                                    )}
                                                                    {it.fromAppointment && (
                                                                        <span className="text-[9px] bg-blue-100 text-blue-700 font-black px-1.5 py-0.5 rounded ml-2 uppercase tracking-tighter">Appt</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-gray-500 mb-2">
                                                                    Group: <span className="font-semibold text-gray-700">{it.group}</span>
                                                                    {it.isAttended && <span className="ml-2 text-green-600 font-bold">✓ Attended</span>}
                                                                </p>

                                                                {/* Stage-specific information */}
                                                                {col.id === 'screening' && it.screeningStatus && (
                                                                    <div className={`text-[10px] font-bold px-2 py-1 rounded-md mb-2 ${it.screeningStatus === 'approved' ? 'bg-green-100 text-green-700' :
                                                                        it.screeningStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                            'bg-yellow-100 text-yellow-700'
                                                                        }`}>
                                                                        {it.screeningStatus === 'approved' ? '✓ Approved' :
                                                                            it.screeningStatus === 'rejected' ? '✗ Rejected' :
                                                                                '⏸ Deferred'}
                                                                    </div>
                                                                )}

                                                                {col.id === 'in-progress' && it.collectionData?.bloodBagIdGenerated && (
                                                                    <div className="space-y-1 mb-2">
                                                                        <div className="text-[10px] font-mono bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                                                            🏷️ {it.collectionData.bloodBagIdGenerated}
                                                                        </div>
                                                                        {it.collectionData.volumeCollected && (
                                                                            <div className="text-[10px] text-gray-600">
                                                                                💉 {it.collectionData.volumeCollected}ml {it.collectionData.componentType}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {col.id === 'completed' && it.collectionData?.bloodBagIdGenerated && (
                                                                    <div className="space-y-1 mb-2">
                                                                        <div className="text-[10px] font-mono bg-green-100 text-green-800 px-2 py-1 rounded truncate">
                                                                            🏷️ {it.collectionData.bloodBagIdGenerated}
                                                                        </div>
                                                                        {it.labTests?.allTestsPassed !== undefined ? (
                                                                            <div className={`text-[10px] font-bold ${it.labTests.allTestsPassed ? 'text-green-600' : 'text-red-600'
                                                                                }`}>
                                                                                {it.labTests.allTestsPassed ? '✓ Tests Passed' : '✗ Tests Failed'}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-[10px] text-orange-600 font-semibold">
                                                                                ⏳ Tests Pending
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {col.id === 'ready-storage' && it.collectionData?.bloodBagIdGenerated && (
                                                                    <div className="space-y-1 mb-2">
                                                                        <div className="text-[10px] font-mono bg-purple-100 text-purple-800 px-2 py-1 rounded truncate">
                                                                            🏷️ {it.collectionData.bloodBagIdGenerated}
                                                                        </div>
                                                                        <div className="text-[10px] text-purple-600 font-bold">
                                                                            ✓ Ready for Inventory
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="flex items-center justify-between">
                                                                    <div className="text-[10px] font-bold px-2 py-1 rounded-md bg-gray-50 text-gray-600 border border-gray-100">
                                                                        {format(new Date(it.date), 'dd MMM')}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    ))}
                </DragDropContext>
            </div>

            {/* New Donation Modal */}
            {showAddDonationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">Register New Donor</h3>
                            <p className="text-sm text-gray-500 mt-1">Add a new donor to the donation pipeline</p>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Donor Search */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                    <Search size={16} />
                                    Search Existing Donor or Enter New
                                </label>
                                <input
                                    type="text"
                                    value={donorSearchTerm}
                                    onChange={(e) => {
                                        setDonorSearchTerm(e.target.value);
                                        setNewDonation({ ...newDonation, donorName: e.target.value });
                                    }}
                                    placeholder="Search by name, email, or phone..."
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                />

                                {/* Search Results Dropdown */}
                                {donorSearchResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {donorSearchResults.map((donor) => (
                                            <button
                                                key={donor._id}
                                                type="button"
                                                onClick={() => selectDonor(donor)}
                                                className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0 transition flex items-center gap-3"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
                                                    {donor.Name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-semibold text-gray-800">{donor.Name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {donor.bloodGroup} • {donor.Email}
                                                        {donor.lastDonationDate && (
                                                            <span className="ml-2">
                                                                Last: {new Date(donor.lastDonationDate).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {searching && (
                                    <div className="absolute right-3 top-9 text-gray-400">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    </div>
                                )}

                                <p className="text-xs text-gray-500 mt-1">
                                    {donorSearchResults.length > 0
                                        ? `Found ${donorSearchResults.length} existing donor(s)`
                                        : donorSearchTerm.length >= 2 && !searching
                                            ? 'No existing donors found - will create new'
                                            : 'Start typing to search existing donors'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group *</label>
                                <select
                                    value={newDonation.bloodGroup}
                                    onChange={(e) => setNewDonation({ ...newDonation, bloodGroup: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-100 outline-none"
                                >
                                    {bloodGroups.map((group) => (
                                        <option key={group} value={group}>{group}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={newDonation.phone}
                                    onChange={(e) => setNewDonation({ ...newDonation, phone: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none ${phoneExists
                                        ? 'border-yellow-300 focus:ring-yellow-100 bg-yellow-50'
                                        : 'border-gray-200 focus:ring-red-100'
                                        }`}
                                    placeholder="1234567890"
                                />
                                {checkingPhone && (
                                    <div className="absolute right-3 top-9 text-gray-400">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    </div>
                                )}
                                {phoneExists && (
                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs text-yellow-800">
                                                <User size={14} />
                                                <span>
                                                    <strong>{phoneExists.Name}</strong> already exists with this phone
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => selectDonor(phoneExists)}
                                                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                            >
                                                Use Existing
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={newDonation.email}
                                    onChange={(e) => setNewDonation({ ...newDonation, email: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none ${emailExists
                                        ? 'border-yellow-300 focus:ring-yellow-100 bg-yellow-50'
                                        : 'border-gray-200 focus:ring-red-100'
                                        }`}
                                    placeholder="john@example.com"
                                />
                                {checkingEmail && (
                                    <div className="absolute right-3 top-9 text-gray-400">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    </div>
                                )}
                                {emailExists && (
                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs text-yellow-800">
                                                <User size={14} />
                                                <span>
                                                    <strong>{emailExists.Name}</strong> already exists with this email
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => selectDonor(emailExists)}
                                                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                            >
                                                Use Existing
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    value={newDonation.notes}
                                    onChange={(e) => setNewDonation({ ...newDonation, notes: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-100 outline-none"
                                    rows="3"
                                    placeholder="First time donor, no medical history..."
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowAddDonationModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddDonation}
                                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
                            >
                                Register Donor
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Screening Form Modal */}
            {showScreeningModal && selectedDonation && (
                <ScreeningFormModal
                    donation={selectedDonation}
                    onClose={() => {
                        setShowScreeningModal(false);
                        setSelectedDonation(null);
                    }}
                    onSuccess={() => {
                        fetchDonations();
                        fetchStats();
                    }}
                />
            )}

            {/* Donor Details Modal */}
            {showDetailsModal && selectedDonation && (
                <DonorDetailsModal
                    donation={selectedDonation}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedDonation(null);
                    }}
                    onNext={async (donation) => {
                        try {

                            // Check if this is an appointment (from NEW DONORS)
                            if (donation.fromAppointment) {
                                // Create donation record first
                                const donationData = {
                                    donorName: donation.name,
                                    bloodGroup: donation.group,
                                    phone: donation.phone,
                                    email: donation.email,
                                    notes: donation.notes,
                                    appointmentId: donation.appointmentId || donation._id,
                                    organizationId: user._id
                                };

                                try {
                                    const newDonation = await adminApi.createDonation(donationData);
                                    const donationId = newDonation._id || newDonation.donation?._id || newDonation.donation?.id || newDonation.id;

                                    if (donationId) {
                                        // Move to screening
                                        await adminApi.updateDonationStage(donationId, 'screening', user._id);
                                        toast.success('Moved to SCREENING');
                                    }
                                } catch (createError) {
                                    if (createError.response?.status === 400 && createError.response?.data?.message?.includes('already exists')) {
                                        // If donation already exists, find it and move it
                                        const existingDonationId = createError.response?.data?.donationId;
                                        if (existingDonationId) {
                                            await adminApi.updateDonationStage(existingDonationId, 'screening', user._id);
                                            toast.success('Moved to SCREENING');
                                        }
                                    } else {
                                        throw createError;
                                    }
                                }
                            } else if (donation.fromCamp) {
                                // Create donation record for camp participant
                                const donationData = {
                                    donorName: donation.name,
                                    bloodGroup: donation.group,
                                    phone: donation.phone,
                                    email: donation.email,
                                    notes: donation.notes,
                                    campId: donation.campId,
                                    campParticipantId: donation.campParticipantId,
                                    donorId: donation.donorId,
                                    organizationId: user._id
                                };



                                try {
                                    const newDonation = await adminApi.createDonation(donationData);
                                    const donationId = newDonation._id || newDonation.donation?._id || newDonation.donation?.id || newDonation.id;

                                    if (donationId) {
                                        // Move to screening
                                        await adminApi.updateDonationStage(donationId, 'screening', user._id);
                                        toast.success('Moved to SCREENING');
                                    } else {
                                        console.error('❌ No donation ID returned');
                                        toast.error('Failed to get donation ID');
                                    }
                                } catch (createError) {
                                    console.error('❌ Error creating/moving camp donation:', createError);
                                    if (createError.response?.status === 400 && createError.response?.data?.message?.includes('already exists')) {
                                        // If donation already exists, find it and move it
                                        const existingDonationId = createError.response?.data?.donationId;
                                        if (existingDonationId) {
                                            await adminApi.updateDonationStage(existingDonationId, 'screening', user._id);
                                            toast.success('Moved to SCREENING');
                                        }
                                    } else {
                                        throw createError;
                                    }
                                }
                            } else {
                                // Regular donation move (for manually added donors)
                                const donationId = donation.id || donation._id;

                                if (!donationId) {
                                    console.error('❌ No donation ID found in donation object');
                                    toast.error('Cannot move donation - missing ID');
                                    return;
                                }

                                await adminApi.updateDonationStage(donationId, 'screening', user._id);
                                toast.success('Moved to SCREENING');
                            }

                            // Close modal and refresh
                            setShowDetailsModal(false);
                            setSelectedDonation(null);
                            await fetchDonations();
                            fetchStats();
                        } catch (error) {
                            console.error('❌ Failed to move to screening:', error);
                            toast.error('Failed to move to screening');
                        }
                    }}
                />
            )}

            {/* Blood Collection Modal */}
            {showCollectionModal && selectedDonation && (
                <BloodCollectionModal
                    donation={selectedDonation}
                    onClose={() => {
                        setShowCollectionModal(false);
                        setSelectedDonation(null);
                    }}
                    onSuccess={() => {
                        fetchDonations();
                        fetchStats();
                    }}
                />
            )}

            {/* Lab Testing Modal */}
            {showLabTestModal && selectedDonation && (
                <LabTestingModal
                    donation={selectedDonation}
                    onClose={() => {
                        setShowLabTestModal(false);
                        setSelectedDonation(null);
                    }}
                    onSuccess={() => {
                        fetchDonations();
                    }}
                />
            )}
        </div>
    );
};

export default BloodBankDonationPipeline;
