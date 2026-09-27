import Project from '../models/Project.js';
import Task from '../models/Task.js';

export async function dashboard(req,res){
  const pFilter=req.user.role==='ADMIN'?{}:{$or:[{owner:req.user._id},{members:req.user._id}]};
  const projects=await Project.find(pFilter);
  const projectIds=projects.map(p=>p._id);
  const tasks=await Task.find({project:{$in:projectIds}}).populate('project assignedUser', 'name email');
  const now=new Date();
  const overdue=tasks.filter(t=>t.status!=='COMPLETED'&&new Date(t.dueDate)<now);
  const active=projects.filter(p=>['PLANNING','IN_PROGRESS'].includes(p.status));
  const completed=projects.filter(p=>p.status==='COMPLETED');
  const progress=projects.map(p=>{
    const pt=tasks.filter(t=>t.project.equals(p._id));
    const done=pt.filter(t=>t.status==='COMPLETED').length;
    return {projectId:p._id,name:p.name,total:pt.length,completed:done,progress:pt.length?Math.round(done/pt.length*100):0};
  });
  res.json({stats:{totalProjects:projects.length,activeProjects:active.length,completedProjects:completed.length,totalTasks:tasks.length,pendingTasks:tasks.filter(t=>t.status!=='COMPLETED').length,completedTasks:tasks.filter(t=>t.status==='COMPLETED').length,overdueTasks:overdue.length,highPriorityTasks:tasks.filter(t=>['HIGH','CRITICAL'].includes(t.priority)).length},progress,overdue:overdue.map(t=>({...t.toObject(),isOverdue:true}))});
}