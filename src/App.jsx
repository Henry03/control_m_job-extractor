import { useEffect, useState } from 'react';
import { convertXML } from 'simple-xml-to-json';
import './App.css'
import { Background, Controls, ReactFlow, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import Nodes from './components/Nodes';

const nodeTypes = {
  custom: Nodes
}

function App() {
  const [json, setJson] = useState();
  const [folder, setFolder] = useState(-1);
  const [jobs, setJobs] = useState();
  const [flow, setFlow] = useState("");

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [nodesState, setNodesState, onNodesStateChange] = useNodesState([])
  const [edgesState, setEdgesState, onEdgesStateChange] = useNodesState([])
  const edgeType = 'default';

  function handleChange(e) {
    e.preventDefault()
    const reader = new FileReader()
    reader.onload = async (e) => { 
      const text = (e.target.result)
      
      const jsonParse = convertXML(modifyXml(text)) 
      console.log(jsonParse.DEFTABLE.children)
      setJson(jsonParse.DEFTABLE.children)
    };
    reader.readAsText(e.target.files[0])
  }

  function modifyXml (xmlData) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, "application/xml");
 
    const folderElements = xmlDoc.getElementsByTagName("FOLDER");

    for (let folder of folderElements) {
      folder.removeAttribute("VERSION");
      folder.removeAttribute("PLATFORM");
      folder.removeAttribute("MODIFIED");
      folder.removeAttribute("LAST_UPLOAD");
      folder.removeAttribute("FOLDER_ORDER_METHOD");
      folder.removeAttribute("REAL_FOLDER_ID");
      folder.removeAttribute("TYPE");

      const jobElements = folder.getElementsByTagName("JOB");
  
      for (let job of jobElements) {
        const app = job.getAttribute("APPLICATION");
        const subApp = job.getAttribute("SUB_APPLICATION");
        const memName = job.getAttribute("MEMNAME");
        const jobName = job.getAttribute("JOBNAME");

        // Remove all attributes
        while (job.attributes.length > 0) {
          job.removeAttribute(job.attributes[0].name);
        }

        // Reassign only APPLICATION and SUB_APPLICATION
        if (app) job.setAttribute("APPLICATION", app);
        if (subApp) job.setAttribute("SUB_APPLICATION", subApp);
        if (memName) job.setAttribute("MEMNAME", memName);
        if (jobName) job.setAttribute("JOBNAME", jobName);

        const incondElements = job.getElementsByTagName("INCOND");
        const outElements = job.getElementsByTagName("OUTCOND");
        const quantitativeElements = job.getElementsByTagName("QUANTITATIVE");
        const onElements = job.getElementsByTagName("ON");
        const variableElements = job.getElementsByTagName("VARIABLE");
        const shoutElements = job.getElementsByTagName("SHOUT");
        const captureElements = job.getElementsByTagName("CAPTURE");
        const controlElements = job.getElementsByTagName("CONTROL");
        
        for (let incond of incondElements) {
          incond.removeAttribute("ODATE");
          incond.removeAttribute("AND_OR");
        }

        // Remove QUANTITATIVE elements
        while (outElements.length > 0) {
          job.removeChild(outElements[0]);
        }
        
        // Remove QUANTITATIVE elements
        while (quantitativeElements.length > 0) {
          job.removeChild(quantitativeElements[0]);
        }

        // Remove QUANTITATIVE elements
        while (onElements.length > 0) {
          job.removeChild(onElements[0]);
        }

        // Remove QUANTITATIVE elements
        while (variableElements.length > 0) {
          job.removeChild(variableElements[0]);
        }

        // Remove QUANTITATIVE elements
        while (shoutElements.length > 0) {
          job.removeChild(shoutElements[0]);
        }

        // Remove CAPTURE elements
        while (captureElements.length > 0) {
          job.removeChild(captureElements[0]);
        }

        // Remove CAPTURE elements
        while (controlElements.length > 0) {
          job.removeChild(controlElements[0]);
        }
      }  
    }


    const serializer = new XMLSerializer();
    const newXmlString = serializer.serializeToString(xmlDoc);

    return newXmlString;
  };

  function getFirstJobByFolder () {
    const filteredFolder = json[folder].FOLDER;

    setJobs(filteredFolder.children
      .map(item => item.JOB)
      .filter(job =>
        !job.children ||
        !job.children.some(child => child.INCOND)
      ))
  }

  function findJob ( jobName) {
    const jobData = json[folder].FOLDER.children

    jobData.forEach((job) => {
      if(job.JOB.JOBNAME == jobName)
      {
        nodes.push({
          id : job.JOB.JOBNAME,
          data : {
            label : job.JOB.JOBNAME
          },
          type: "custom"
        })

        findAllRelatedJob ( job.JOB.JOBNAME)

      }
    }
  )}

  function findAllRelatedJob ( jobName) {
    let isRelated = 0;
    const jobData = json[folder].FOLDER.children

    jobData.forEach((job) => {
      if(job.JOB.children)
      {
        job.JOB.children.forEach((parent) => {
          if (parent.INCOND.NAME.includes(jobName)){
            isRelated = 1;
            nodes.push({
              id : job.JOB.JOBNAME,
              data : {
                label : job.JOB.JOBNAME
              },
              position : {
                x: 0,
                y: 0
              },
            type: "custom"
            })
            edges.push({
              id : job.JOB.JOBNAME,
              source : jobName,
              target : job.JOB.JOBNAME,
              type: edgeType || "default", 
              animated: true
            })
            findAllRelatedJob ( job.JOB.JOBNAME)
          }
        })
        if(isRelated === 1) {
          job.JOB.children.forEach((parent) => {
            if (!parent.INCOND.NAME.includes(jobName)){
              findAllRelatedJobParent (parent.INCOND.NAME, job.JOB.JOBNAME )
            }
          })
        }
        isRelated = 0;
      }
    }
  )

  function findAllRelatedJobParent (jobName, prevJob) {
    const jobData = json[folder].FOLDER.children
    jobData.forEach((job) => {
      if(jobName.includes(job.JOB.JOBNAME)){
        if(job.JOB.children){
          console.log(job.JOB.children)
          nodes.push({
            id : job.JOB.JOBNAME,
            data : {
              label : job.JOB.JOBNAME
            },
            position : {
              x: 0,
              y: 0
            },
            type: "custom"
          })
          edges.push({
            id : job.JOB.JOBNAME,
            source : job.JOB.JOBNAME,
            target : prevJob,
            type: edgeType || "default", 
            animated: true
          })
          job.JOB.children.forEach((child) => {
            console.log(child)
            console.log(job.JOB.JOBNAME)
            console.log(prevJob)
            if(child.INCOND){
              findAllRelatedJobParent(child.INCOND.NAME, job.JOB.JOBNAME)
            }
          })
        }
        else{
            nodes.push({
              id : job.JOB.JOBNAME,
              data : {
                label : job.JOB.JOBNAME
              },
              position : {
                x: 0,
                y: 0
              },
              type: "custom"
            })
            edges.push({
              id : job.JOB.JOBNAME,
              source : job.JOB.JOBNAME,
              target : prevJob,
              type: edgeType || "default", 
              animated: true
            })
          }
        }
      })
    }
  }

  const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
  
    const isHorizontal = direction === 'LR'; // Change layout direction if needed
    dagreGraph.setGraph({ rankdir: direction });
  
    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 150, height: 50 });
    });
  
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });
  
    dagre.layout(dagreGraph);
  
    const updatedNodes = nodes.map((node) => {
      const { x, y } = dagreGraph.node(node.id);
      return {
        ...node,
        position: { x, y },
      };
    });
  
    return { nodes: updatedNodes, edges };
  };

  useEffect (() => {
    if(folder != -1){
      json && getFirstJobByFolder()
    }else {
      setJobs()
    }
  }, [folder])

  useEffect (() => {
    if(flow != ""){
      setNodes([])
      setEdges([])
      json && jobs && findJob(flow)
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
      setNodesState(layoutedNodes);
      setEdgesState(layoutedEdges);
      console.log(layoutedNodes);
      console.log(layoutedEdges);
        
    }else {
      setJobs()
    }
  }, [flow])

  useEffect(() => {
    console.log("Edges before state update:", edges);
  }, [edges]);

  return (
    <>
      <h1 className="text-red-500">Job Extractor</h1>
      <input type="file" onChange={handleChange} />
      <select value={folder} onChange={(e) => setFolder(e.target.value)}>
        <option value={-1}>Select Folder</option>
        {
          json &&
          json.map((folderItem, index) => {
            return (
              <option value={index} key={index}>{folderItem.FOLDER.FOLDER_NAME}</option>
            )
          })
        }

      </select>
      <table className='h-full'>
        <tbody>
          {
            jobs ?
            jobs.map((item, index) => {
              return (
                <tr key={index}>
                  <td onClick={()=>setFlow(item.JOBNAME)}>{item.JOBNAME}</td>
                </tr>
              )
            })
            : null
          }
        </tbody>
      </table>
      
      <div className='h-dvh'>
      <ReactFlow 
          nodes={nodesState} 
          edges={edgesState} 
          onNodesChange={onNodesStateChange}
          onEdgesChange={onEdgesStateChange}
          nodeTypes={nodeTypes}
        >
        <Background />
        <Controls />
      </ReactFlow>
      </div>
    </>
  )
}

export default App
