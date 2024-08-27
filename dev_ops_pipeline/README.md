<div align="center">

![](https://img.shields.io/badge/ArgoCD--orange?style=plastic&logo=argo)&nbsp;
![](https://img.shields.io/badge/Docker--blue?style=plastic&logo=docker)&nbsp;
![](https://img.shields.io/badge/Kubernetes--blue?style=plastic&logo=kubernetes)&nbsp;
![](https://img.shields.io/badge/GitHub-Actions-blue?style=plastic&logo=githubactions)&nbsp;

</div>

# Table of contents
- [Branching Strategy](#branching-strategy)
- [CI/CD](#cicd-pipeline)
  - [CI](#ci-on-source-code-repository)
  - [CD](#cd-from-the-manifest-repository) 
- [Disaster Recovery](#disaster-recovery)
- [Task Execution Plan](#task-execution-plan)
  - [Functionality](#phase-1-functionality)
  - [To the Sky](#phase-2-to-the-sky)


# Branching Strategy
![branching](/dev_ops_pipeline/branching_strategy.png)

1. There will be two primary branches, `main` and `stage` for production and staging environment 
2. Developers will create feature/bugfix branches from the main branch
3. Issue a PR to the stage branch
4. maintainers/admins will approve and merge PRs
5. If any feature is not working, the staging branch will be reverted to keep the branch clean
6. After successful testing on staging environment, maintainers will create another PR from stage to main and to go to production
7. After each successful merge, the branch will be deleted

# CI/CD Pipeline
![cicd](/dev_ops_pipeline/ci_cd.png)

We will follow `GitOps` principle and will use a pull based deployment method.

## CI (on Source Code Repository)
- developers will fork `main` branch and create branches for feature/doc or bugfixes in such manner - 
  - feat/feature_name
  - bugfix/bug_name
- on every push to feature branches, some tests will be run (unit test, docker build, linting etc.)
- to further proceed, a developer will create a PR to the `stage` branch
- the maintainer/admin will approve the PRs
- at this stage, the new feature should be available online on the staging environment. Here the testers can perform the tests.
  - if it passes testing, the maintainer/admin will create a PR to the `main` branch and merge it.
    - here code will be again auto tested and the manifest files will be updated with new docker tag and pushed to the `manifest repo`
  - if it does not pass the stage test, the last PR will be reverted in order to keep the branch clean.

## CD (from the Manifest Repository)
- the k8s yaml manifest files will reside in this repository
- `ArgoCD` will keep on monitoring this repository to find any changes to adjust the cluster accordingly

## Disaster Recovery
In case of disasters, for faster recovery we can just select previous stable version of the manifest to make the system stable ASAP. A simple webpage with the last few commit SHA might come in handy.

# Task execution plan
- Estimate max resource consumption to not exceed more than 70% of the host machine
## Phase 1 (functionality)
- Setup Master Node
- Setup Worker Node and connect with the master Node
- Configure ArgoCD 
- Test a basic deployment

## Phase 2 (To the sky)
- Configure Ingress Controller (Nginx?)
- DNS resolution and SSL on Ingress
- Write each components manifest files 
- Integrate monitoring solutions