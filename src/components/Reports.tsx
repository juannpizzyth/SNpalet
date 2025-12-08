import { FileText } from 'lucide-react';

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Generate and view scan reports</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-12 border-4 border-red-600">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-red-100 p-6 rounded-full mb-4">
            <FileText className="w-12 h-12 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Reports Coming Soon</h3>
          <p className="text-gray-600 max-w-md">
            The reporting feature is under development. You will be able to generate comprehensive scan reports, export data to Excel, and analyze scan patterns.
          </p>
        </div>
      </div>
    </div>
  );
}
