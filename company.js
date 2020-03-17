class Director {
  constructor(web, mob, qa) {
    this.projectsTotalCount = 0;
    this.incomingProjects = [];
  } 
  
  takeProjects() {
    const incomingProjectsCount = Math.round(Math.random() * 4);
    this.projectsTotalCount += incomingProjectsCount;
    for (let i = 0; i < incomingProjectsCount; i++) {
      this.incomingProjects.push(new Project());
    }
  } 

  sortProject(web, mob) {

    this.incomingProjects.forEach((project) => {
      if (project.type === 'web' && web.staff.some(unit => !unit.atWork)) {
        web.projects.push(project);
        project.inProgress = true;
      }
      if (project.type === 'mob' && mob.staff.some(unit => !unit.atWork)) {
        mob.projects.push(project);
        project.inProgress = true;
      }
    })
    const pendingProjects = this.incomingProjects.filter(project => !project.inProgress);
    this.incomingProjects = pendingProjects;
  }

  recruiting(web, mob, qa) {
    this.hireWorkers(this.incomingProjects, 'web', web);
    this.hireWorkers(this.incomingProjects, 'mob', mob);
    this.hireWorkers(qa.projects, 'qa', qa);
  }; 

  hireWorkers(projects, type, dep) {
    projects.forEach(project => {
      if (project.type === type && (dep.staff.every(unit => unit.atWork) || !dep.staff.length)) {
        const newWorker = new Developer();
        dep.staff = [...dep.staff, newWorker];
        dep.hiredWorkersCount += 1;
      };
    });
  }

  idleWorkers(dep) {
    const newStaff = dep.staff.map(unit => {
      if(!unit.atWork) {
        unit.idle += 1;
      }
      return unit;
    });
    dep.staff = newStaff;
  }
}

class Project {
  constructor() {
  const types = ['web', 'mob'];
    this.type = types[Math.round(Math.random())];
		this.complexity = Math.floor(1 + Math.random() * 3);
		this.duration = this.complexity;
    this.isDone = false;
    this.inProgress = false;
    this.workers = [];
  }
}
          
class Department {
  constructor(type) {
    this.type = type;
    this.projects = [];
    this.staff = [];
    this.firedWorkersCount = 0;
    this.hiredWorkersCount = 0;
    this.doneProjectsCount = 0;
  }

  firing() {
    if(this.staff.some(unit => unit.idle > 3)) {
      let sortedStaff = this.staff.sort((a, b) => a.exp - b.exp);
      const firedWorkerIndex = sortedStaff.findIndex(unit => unit.idle >= 3);
      sortedStaff.splice(firedWorkerIndex, 1);
      this.staff = sortedStaff;
      this.firedWorkersCount += 1;
    }
	}	
}

class WebDepartment extends Department {
  projectAtWork(qa) {
		this.staff.forEach(unit => {
			if (!unit.atWork && this.projects.length) {
				unit.assign(this.projects.shift())
			}
			if (unit.atWork && unit.project.duration >= 1) {
				unit.project.duration -= 1;
				if (unit.project.duration === 0 ) {
          unit.project.type = 'qa';
					qa.projects.push(unit.project);
					unit.project = {};
					unit.exp += 1;
          unit.atWork = false;
				}
			}
		})
	}
}

class MobDepartment extends Department {
  projectAtWork(qa) {
    this.projects.forEach(project => {

      if (project.duration > project.workers.length) {
        this.staff.forEach(unit => {
          if (!unit.atWork) {
            unit.atWork = true;
            unit.idle = 0;
            project.inProgress = true;
            project.workers.push(unit);
            project.duration -= 1;
          }      
        })
      }

      if (project.duration === 0) {
        project.workers.forEach(unit => {
          unit.atWork = false;
          unit.exp += 1;
          this.staff.push(unit);
        })
        project.workers = [];
        project.type = 'qa';
        qa.projects.push(project);
        const notYetQA = this.projects.filter(project => project.type !== 'qa');
        this.projects = notYetQA;
      }
      
    })
    const idleWorkers = this.staff.filter(unit => !unit.atWork);
    this.staff = idleWorkers;
	}
}

class QADepartment extends Department {
  projectAtWork() {
    this.staff.forEach(unit => {
      if(unit.atWork) {
        unit.project.isDone = true;
				unit.exp += 1;
				unit.project = {};
        unit.atWork = false;
        this.doneProjectsCount += 1;
      }

			if (!unit.atWork && this.projects.length) {
				unit.assign(this.projects.shift());
			}      
    })
  }
}

class Developer {
  constructor() {
    this.atWork = false;
    this.idle = 0;
    this.exp = 0;
    this.project = {};
  }

  assign(project) {
    this.project = project;
    this.atWork = true;
    this.idle = 0;
  }
}

function company(days) {
	let webDep = new WebDepartment('web');
	let mobDep = new MobDepartment('mob');
  let qaDep = new QADepartment('qa');
  const director = new Director(webDep, mobDep, qaDep);

	for (let i = 1; i <= days; i++) {
    director.takeProjects();

    director.sortProject(webDep, mobDep);
    director.recruiting(webDep, mobDep, qaDep);

    webDep.projectAtWork(qaDep);
    mobDep.projectAtWork(qaDep);
    qaDep.projectAtWork();

    director.idleWorkers(webDep);
    director.idleWorkers(mobDep);
    director.idleWorkers(qaDep);

    webDep.firing();
    mobDep.firing();
    qaDep.firing();  
  }

  console.log(`принято проектов: ${director.projectsTotalCount}`);
  console.log(`нанято разработчиков ${mobDep.hiredWorkersCount + webDep.hiredWorkersCount + qaDep.hiredWorkersCount}`)
  console.log(`выполнено проектов: ${qaDep.doneProjectsCount}`);
  console.log(`уволено разработчиков ${mobDep.firedWorkersCount + webDep.firedWorkersCount + qaDep.firedWorkersCount}`)

}
company(1000);