import { Handle, Position } from "@xyflow/react";
import { useState } from "react";

function Nodes ({data}) {
    const [checked, setChecked] = useState(false);

    return (
      <div className="p-2 border rounded bg-white shadow px-5 py-2">
        <label className="flex items-center gap-2 text-xs">
          <input 
            type="checkbox" 
            checked={checked} 
            onChange={() => setChecked(!checked)} 
          />
          {data.label}
        </label>
  
        {/* Input handle for edges */}
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
      </div>
    );
}

export default Nodes;