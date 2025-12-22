import { useState } from "react";
import client from "../../api/client";
import { toast } from "sonner";
import { Droplet, Calendar, Barcode, Hash } from "lucide-react";

const AddInventory = ({ onAdded }) => {
  const [form, setForm] = useState({
    group: "",
    component: "WB",
    collectionDate: "",
    expiryDate: "",
    barcode: "",
    quantity: 1, // New field
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Auto-calculate expiry date based on component and collection date
    if (name === "component" || name === "collectionDate") {
      autoCalculateExpiry(name === "component" ? value : form.component, name === "collectionDate" ? value : form.collectionDate);
    }
  };

  const autoCalculateExpiry = (component, collectionDate) => {
    if (!collectionDate) return;

    const collection = new Date(collectionDate);
    let daysToAdd = 0;

    // Set expiry based on component type
    switch (component) {
      case 'WB': daysToAdd = 35; break; // Whole Blood: 35 days
      case 'RBC': daysToAdd = 42; break; // Red Blood Cells: 42 days
      case 'Platelets': daysToAdd = 5; break; // Platelets: 5 days
      case 'Plasma': daysToAdd = 365; break; // Plasma (frozen): 1 year
      case 'Cryo': daysToAdd = 365; break; // Cryoprecipitate: 1 year
      default: daysToAdd = 35;
    }

    const expiry = new Date(collection);
    expiry.setDate(expiry.getDate() + daysToAdd);

    setForm(prev => ({
      ...prev,
      expiryDate: expiry.toISOString().split('T')[0]
    }));
  };

  const generateBarcode = () => {
    const prefix = form.group.replace('+', 'P').replace('-', 'N');
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  const handleGenerateBarcode = () => {
    if (!form.group) {
      toast.error("Please select blood group first");
      return;
    }
    const newBarcode = generateBarcode();
    setForm(prev => ({ ...prev, barcode: newBarcode }));
    toast.success("Barcode generated!");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.group || !form.collectionDate || !form.expiryDate) {
      toast.error("Please fill all required fields");
      return;
    }

    const quantity = parseInt(form.quantity) || 1;
    if (quantity < 1 || quantity > 100) {
      toast.error("Quantity must be between 1 and 100");
      return;
    }

    try {
      setLoading(true);

      const quantity = parseInt(form.quantity) || 1;
      console.log(`🔄 Starting bulk add: ${quantity} units`);

      // Create multiple units
      const createdUnits = [];
      const errors = [];

      for (let i = 0; i < quantity; i++) {
        try {
          const barcode = form.barcode && quantity === 1
            ? form.barcode
            : generateBarcode(); // Auto-generate unique barcode for each unit

          console.log(`📦 Creating unit ${i + 1}/${quantity} with barcode: ${barcode}`);

          const res = await client.post("/api/org/inventory", {
            group: form.group,
            component: form.component,
            collectionDate: form.collectionDate,
            expiryDate: form.expiryDate,
            barcode: barcode,
          });

          createdUnits.push(res.data);
          console.log(`✅ Unit ${i + 1}/${quantity} created successfully:`, res.data._id);

          // Small delay to ensure unique timestamps for barcodes
          if (i < quantity - 1) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        } catch (unitError) {
          console.error(`❌ Failed to create unit ${i + 1}/${quantity}:`, unitError);
          errors.push({ index: i + 1, error: unitError.response?.data?.message || unitError.message });
        }
      }

      console.log(`📊 Bulk add complete: ${createdUnits.length}/${quantity} units created successfully`);

      // Clear form only if at least one unit was created
      if (createdUnits.length > 0) {
        setForm({ group: "", component: "WB", collectionDate: "", expiryDate: "", barcode: "", quantity: 1 });

        // Notify parent ONCE with all created units
        if (onAdded) {
          console.log(`🔔 Notifying parent of ${createdUnits.length} new units`);
          // Call onAdded once with all units
          onAdded(createdUnits);
        }
      }

      // Show appropriate success/error message
      if (errors.length === 0) {
        toast.success(`${quantity} blood unit${quantity > 1 ? 's' : ''} added successfully!`);
      } else if (createdUnits.length > 0) {
        toast.warning(`${createdUnits.length}/${quantity} units added. ${errors.length} failed.`);
      } else {
        toast.error(`Failed to add units. Please try again.`);
      }

    } catch (err) {
      console.error('Bulk add error:', err);
      toast.error(err.response?.data?.message || "Failed to add inventory");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Blood Group */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
            <Droplet size={16} className="text-red-600" />
            Blood Group <span className="text-red-500">*</span>
          </label>
          <select
            name="group"
            value={form.group}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
          >
            <option value="">Select Blood Group</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Component */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Component Type <span className="text-red-500">*</span></label>
          <select
            name="component"
            value={form.component}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="WB">Whole Blood (35 days)</option>
            <option value="RBC">Red Blood Cells (42 days)</option>
            <option value="Platelets">Platelets (5 days)</option>
            <option value="Plasma">Plasma (1 year)</option>
            <option value="Cryo">Cryoprecipitate (1 year)</option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
            <Hash size={16} className="text-purple-600" />
            Number of Units <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
            min="1"
            max="100"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Add 1-100 units at once (unique barcodes auto-generated)</p>
        </div>

        {/* Collection Date */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
            <Calendar size={16} className="text-blue-600" />
            Collection Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="collectionDate"
            value={form.collectionDate}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
          />
        </div>

        {/* Expiry Date */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
            <Calendar size={16} className="text-orange-600" />
            Expiry Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="expiryDate"
            value={form.expiryDate}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Auto-calculated based on component type</p>
        </div>

        {/* Barcode - Only for single unit */}
        {parseInt(form.quantity) === 1 && (
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
              <Barcode size={16} className="text-gray-600" />
              Barcode (Optional - Auto-generated if empty)
            </label>
            <div className="flex gap-2">
              <input
                name="barcode"
                value={form.barcode}
                onChange={handleChange}
                placeholder="Leave empty for auto-generation"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
              />
              <button
                type="button"
                onClick={handleGenerateBarcode}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
              >
                Generate
              </button>
            </div>
          </div>
        )}

        {parseInt(form.quantity) > 1 && (
          <div className="md:col-span-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>💡 Bulk Add:</strong> {form.quantity} units will be created with unique auto-generated barcodes
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg px-6 py-3 font-semibold hover:shadow-lg transform hover:scale-[1.02] transition disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading
            ? `Adding ${form.quantity} Unit${parseInt(form.quantity) > 1 ? 's' : ''}...`
            : `✓ Add ${form.quantity} Blood Unit${parseInt(form.quantity) > 1 ? 's' : ''}`
          }
        </button>
      </div>
    </form>
  );
};

export default AddInventory;

