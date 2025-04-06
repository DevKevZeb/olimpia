import React from 'react';

interface DebugDataProps {
  data: any;
  title?: string;
  collapsed?: boolean;
}

const DebugData: React.FC<DebugDataProps> = ({ data, title = 'Debug Data', collapsed = true }) => {
  return (
    <div className="p-4 border rounded-lg bg-gray-50 my-4">
      <details open={!collapsed}>
        <summary className="font-medium text-gray-700 cursor-pointer">{title}</summary>
        <pre className="mt-2 p-3 bg-gray-100 rounded-md text-xs overflow-auto max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default DebugData;
