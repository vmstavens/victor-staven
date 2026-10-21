// Add verified details here. Empty fields are deliberately omitted from the site.
export const profile = {
  name: 'Victor Melbye Staven',
  shortName: 'Victor Staven',
  role: 'PhD researcher in robotics',
  description: 'Research in robot learning, deformable object manipulation, and dexterous manipulation.',
  bio: 'I am a PhD researcher at SDU Robotics, University of Southern Denmark, working on dexterous manipulation for industrial automation with Christoffer Sloth. My research focuses on deformable object manipulation, robot learning, and the transfer of manipulation methods from simulation to physical robots.',
  email: 'vims@mmmi.sdu.dk',
  affiliation: 'SDU Robotics · University of Southern Denmark',
  github: 'https://github.com/vmstavens',
  scholar: 'https://scholar.google.com/citations?user=5VnMGoEAAAAJ&hl=en',
  linkedin: '',
  institutional: 'https://portal.findresearcher.sdu.dk/en/persons/vims/',
  orcid: 'https://orcid.org/0009-0003-2984-0476',
  cv: '', // Place a PDF in public/ and use a relative path, e.g. "cv.pdf".
};

export const research = [
  {
    slug: 'deformable-manipulation', number: '01', kind: 'Deformable objects',
    title: 'Deformable object manipulation', shortTitle: 'Deformable object manipulation',
    description: 'Following and routing flexible cables using tactile sensing and path planning.',
    tags: ['Tactile sensing', 'Cable routing'], graphic: 'cable',
    intro: 'Our ICCMA 2024 work studies cable following and routing using tactile sensing and homotopy-constrained path planning. The system estimates cable pose from tactile feedback and transfers planning and control from MuJoCo simulation to physical hardware.',
    questions: ['How can a policy use the changing shape of a deformable object?', 'How can tactile feedback help a robot follow and route a cable?', 'How should simulation represent the aspects of deformation that matter for control?'],
  },
  {
    slug: 'dexterous-manipulation', number: '02', kind: 'Dexterous interaction',
    title: 'Dexterous manipulation', shortTitle: 'Dexterous manipulation',
    description: 'Combining trajectory optimization and tactile force control for in-hand manipulation with a Shadow Hand.',
    tags: ['Shadow Hand', 'Contact-rich control'], graphic: 'hand',
    intro: 'Our IROS 2025 work combines trajectory optimization with tactile force control for in-hand manipulation. Using a Shadow Robot hand with magnetic tactile sensors, the framework coordinates finger motion and contact to roll small objects more robustly.',
    questions: ['How can robot hands make effective use of their many degrees of freedom?', 'What information about contact is useful for learning manipulation?', 'How can dexterous skills generalize across objects?'],
  },
  {
    slug: 'simulation-and-learning', number: '03', kind: 'Simulation & learning',
    title: 'Simulation and robot learning', shortTitle: 'Simulation & robot learning',
    description: 'Studying how manipulation methods developed in simulation transfer to physical robots.',
    tags: ['Reinforcement learning', 'Sim-to-real'], graphic: 'simulation',
    intro: 'Our published cable-manipulation work develops planning, estimation, and control in MuJoCo before transferring them to a physical setup. This work informs my research on simulation methods for robot manipulation.',
    questions: ['Which variations in simulation help a policy handle the real world?', 'How can visualizations make learned behavior easier to inspect?', 'How should manipulation skills be evaluated beyond a single successful trial?'],
  },
];

export type Publication = {
  title: string; authors: string; venue: string; year: number;
  paper?: string; code?: string; video?: string; bibtex?: string;
};
// Add real papers here; example titles from the planning notes are not publications.
export const publications: Publication[] = [
  {
    title: 'Trajectory Optimization for In-Hand Manipulation with Tactile Force Control',
    authors: 'Haegu Lee, Yitaek Kim, Victor Melbye Staven, Christoffer Sloth',
    venue: 'IEEE/RSJ International Conference on Intelligent Robots and Systems (IROS)', year: 2025,
    paper: 'https://arxiv.org/abs/2503.08222', video: 'https://youtu.be/6J_muL_AyE8',
    bibtex: `@inproceedings{lee2025trajectory,
  title = {Trajectory Optimization for In-Hand Manipulation with Tactile Force Control},
  author = {Lee, Haegu and Kim, Yitaek and Staven, Victor Melbye and Sloth, Christoffer},
  booktitle = {2025 IEEE/RSJ International Conference on Intelligent Robots and Systems (IROS)},
  year = {2025},
  doi = {10.1109/IROS60139.2025.11246500}
}`,
  },
  {
    title: 'Sim-to-Real Transfer for Cable Manipulation with Tactile Sensing and Homotopy-Constrained Path Planning',
    authors: 'Haegu Lee, Victor Melbye Staven, Christoffer Sloth',
    venue: 'International Conference on Control, Mechatronics and Automation (ICCMA)', year: 2024,
    paper: 'https://doi.org/10.1109/ICCMA63715.2024.10843928',
    bibtex: `@inproceedings{lee2024cable,
  title = {Sim-to-Real Transfer for Cable Manipulation with Tactile Sensing and Homotopy-Constrained Path Planning},
  author = {Lee, Haegu and Staven, Victor Melbye and Sloth, Christoffer},
  booktitle = {2024 12th International Conference on Control, Mechatronics and Automation (ICCMA)},
  pages = {382--387},
  year = {2024},
  doi = {10.1109/ICCMA63715.2024.10843928}
}`,
  },
];
