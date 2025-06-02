import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Clock, FileText, User, Phone, Car } from 'lucide-react';
import { parkingRecordsAPI, carsAPI, parkingSlotsAPI } from '../services/api';

const EditParkingRecordForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [formData, setFormData] = useState({
    entryTime: '',
    exitTime: '',
    notes: '',
    driverName: '',
    phoneNumber: '',
    carModel: '',
    carColor: '',
    parkingSlotId: ''
  });
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    fetchRecord();
    fetchAvailableSlots();
  }, [id]);

  const fetchAvailableSlots = async () => {
    try {
      const response = await parkingSlotsAPI.getAll();
      setAvailableSlots(response.data.slots);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const fetchRecord = async () => {
    try {
      setFetchLoading(true);
      const response = await parkingRecordsAPI.getById(id);
      const recordData = response.data;
      setRecord(recordData);
      
      // Format dates for datetime-local input
      const entryTime = new Date(recordData.entryTime);
      const exitTime = recordData.exitTime ? new Date(recordData.exitTime) : null;
      
      setFormData({
        entryTime: formatDateTimeLocal(entryTime),
        exitTime: exitTime ? formatDateTimeLocal(exitTime) : '',
        notes: recordData.notes || '',
        driverName: recordData.car?.driverName || '',
        phoneNumber: recordData.car?.phoneNumber || '',
        carModel: recordData.car?.carModel || '',
        carColor: recordData.car?.carColor || '',
        parkingSlotId: recordData.parkingSlot?._id || ''
      });
    } catch (error) {
      console.error('Error fetching record:', error);
      setError('Failed to load parking record');
    } finally {
      setFetchLoading(false);
    }
  };

  const formatDateTimeLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Update car information first
      const carUpdateData = {
        driverName: formData.driverName,
        phoneNumber: formData.phoneNumber,
        carModel: formData.carModel,
        carColor: formData.carColor
      };

      await carsAPI.update(record.car._id, carUpdateData);

      // Update parking record (backend will handle slot changes automatically)
      const recordUpdateData = {
        entryTime: formData.entryTime,
        exitTime: formData.exitTime || null,
        notes: formData.notes,
        parkingSlot: formData.parkingSlotId
      };

      await parkingRecordsAPI.update(id, recordUpdateData);
      navigate('/parking-records');
    } catch (error) {
      console.error('Error updating record:', error);
      setError(error.response?.data?.message || 'Failed to update parking record');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-600">Parking record not found</p>
          <button
            onClick={() => navigate('/parking-records')}
            className="mt-4 btn-secondary"
          >
            Back to Records
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/parking-records')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Parking Records
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Parking Record</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update parking record details for {record.car?.plateNumber}
        </p>
      </div>

      {/* Car Information (Editable) */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Car Information</h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plate Number (Read-only)
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {record.car?.plateNumber}
              </p>
            </div>
            <div>
              <label htmlFor="driverName" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Driver Name *
              </label>
              <input
                type="text"
                id="driverName"
                name="driverName"
                value={formData.driverName}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="Enter driver name"
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-1" />
                Phone Number *
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label htmlFor="parkingSlotId" className="block text-sm font-medium text-gray-700 mb-2">
                Parking Slot *
              </label>
              <select
                id="parkingSlotId"
                name="parkingSlotId"
                value={formData.parkingSlotId}
                onChange={handleInputChange}
                required
                className="input-field"
              >
                <option value="">Select a parking slot</option>
                {availableSlots.map((slot) => (
                  <option
                    key={slot._id}
                    value={slot._id}
                    disabled={slot.slotStatus === 'occupied' && slot._id !== record.parkingSlot?._id}
                  >
                    {slot.slotNumber} - {slot.location}
                    {slot.slotStatus === 'occupied' && slot._id !== record.parkingSlot?._id ? ' (Occupied)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="carModel" className="block text-sm font-medium text-gray-700 mb-2">
                <Car className="h-4 w-4 inline mr-1" />
                Car Model
              </label>
              <input
                type="text"
                id="carModel"
                name="carModel"
                value={formData.carModel}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Enter car model"
              />
            </div>
            <div>
              <label htmlFor="carColor" className="block text-sm font-medium text-gray-700 mb-2">
                Car Color
              </label>
              <input
                type="text"
                id="carColor"
                name="carColor"
                value={formData.carColor}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Enter car color"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Edit Record Details</h2>
        </div>
        <div className="card-content">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="entryTime" className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Entry Time *
                </label>
                <input
                  type="datetime-local"
                  id="entryTime"
                  name="entryTime"
                  value={formData.entryTime}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="exitTime" className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Exit Time
                </label>
                <input
                  type="datetime-local"
                  id="exitTime"
                  name="exitTime"
                  value={formData.exitTime}
                  onChange={handleInputChange}
                  className="input-field"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty if car is still parked
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-1" />
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="input-field"
                placeholder="Add any additional notes..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/parking-records')}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Record
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditParkingRecordForm;
