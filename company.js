/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable max-classes-per-file */
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

class Developer {
  constructor() {
    this.atWork = false;
    this.idle = 0;
    this.exp = 0;
    this.project = null;
  }

  assignProject(project) {
    this.project = project;
    this.atWork = true;
    this.idle = 0;
  }

  completedProject() {
    this.exp += 1;
    this.project = null;
    this.atWork = false;
  }

  startWorking() {
    this.atWork = true;
    this.idle = 0;
  }

  endWorking() {
    this.atWork = false;
    this.exp += 1;
  }
}

class Director {
  constructor() {
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
      if (project.type === 'web' && web.staff.some((unit) => !unit.atWork)) {
        web.acceptProject(project);
      }
      if (project.type === 'mob' && mob.staff.some((unit) => !unit.atWork)) {
        mob.acceptProject(project);
      }
    });

    const pendingProjects = this.incomingProjects.filter((project) => !project.inProgress);
    this.incomingProjects = pendingProjects;
  }

  recruiting(web, mob, qa) {
    this.hireWorkers(this.incomingProjects, 'web', web);
    this.hireWorkers(this.incomingProjects, 'mob', mob);
    this.hireWorkers(qa.projects, 'qa', qa);
  }

  hireWorkers(projects, type, dep) {
    const filteredProjects = projects.filter((project) => project.type === type);
    projects.forEach((project) => {
      if (project.type === type && (dep.staff.every((unit) => unit.atWork) || !dep.staff.length
          || dep.staff.length < filteredProjects.length)) {
        dep.staff.push(new Developer());
        dep.hiredWorkersCount += 1;
      }
    });
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

  acceptProject(project) {
    this.projects.push(project);
    project.inProgress = true;
  }

  idleWorkers() {
    const newStaff = this.staff.map((unit) => {
      if (!unit.atWork) {
        unit.idle += 1;
      }
      return unit;
    });
    this.staff = newStaff;
  }

  firing() {
    if (this.staff.some((unit) => unit.idle > 3)) {
      this.staff.sort((a, b) => a.exp - b.exp);
      const firedWorkerIndex = this.staff.findIndex((unit) => unit.idle >= 3);
      this.staff.splice(firedWorkerIndex, 1);
      this.firedWorkersCount += 1;
    }
  }
}

class WebDepartment extends Department {
  projectAtWork(qa) {
    this.staff.forEach((unit) => {
      if (!unit.atWork && this.projects.length) {
        unit.assignProject(this.projects.shift());
      }
      if (unit.atWork && unit.project.duration >= 1) {
        unit.project.duration -= 1;
        if (unit.project.duration === 0) {
          unit.project.type = 'qa';
          qa.projects.push(unit.project);
          unit.completedProject();
        }
      }
    });
  }
}

class MobDepartment extends Department {
  projectAtWork(qa) {
    this.projects.forEach((project) => {
      if (project.duration > 0 && project.workers.length === 0 && this.staff.length) {
        project.workers.push(this.staff.shift());
        project.duration -= 1;
      }
      if (project.workers.length > 0) {
        project.workers.forEach((unit) => {
          unit.startWorking();
        });
      }
      if (project.duration === 0) {
        project.workers.forEach((unit) => {
          unit.endWorking();
        });
        this.staff.push(project.workers.shift());
      }
      project.type = 'qa';
      qa.projects.push(project);
    });
    const notYetQA = this.projects.filter((notQaProject) => notQaProject.type !== 'qa');
    this.projects = [...notYetQA];
  }
}

class QADepartment extends Department {
  projectAtWork() {
    this.staff.forEach((unit) => {
      if (!unit.atWork && this.projects.length) {
        unit.assignProject(this.projects.shift());
      }
      if (unit.atWork) {
        unit.project.isDone = true;
        unit.completedProject();
        this.doneProjectsCount += 1;
      }
    });
  }
}

function company(days) {
  const webDep = new WebDepartment('web');
  const mobDep = new MobDepartment('mob');
  const qaDep = new QADepartment('qa');
  const director = new Director(webDep, mobDep, qaDep);

  for (let i = 1; i <= days; i++) {
    director.takeProjects();

    webDep.idleWorkers();
    mobDep.idleWorkers();
    qaDep.idleWorkers();

    director.sortProject(webDep, mobDep);
    director.recruiting(webDep, mobDep, qaDep);

    webDep.projectAtWork(qaDep);
    mobDep.projectAtWork(qaDep);
    qaDep.projectAtWork();

    webDep.firing();
    mobDep.firing();
    qaDep.firing();
  }

  console.log(`принято проектов: ${director.projectsTotalCount}`);
  console.log(`нанято разработчиков ${mobDep.hiredWorkersCount + webDep.hiredWorkersCount + qaDep.hiredWorkersCount}`);
  console.log(`выполнено проектов: ${qaDep.doneProjectsCount}`);
  console.log(`уволено разработчиков ${mobDep.firedWorkersCount + webDep.firedWorkersCount + qaDep.firedWorkersCount}`);
}

company(1000);
