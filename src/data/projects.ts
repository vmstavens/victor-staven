// Curated public projects. Keep unpublished research off the website.
export const projects = [
  {
    id: 'mjsim', category: 'Simulation toolkit', title: 'mjsim',
    description: 'Reusable building blocks for robot simulation: controllers, motion planning, cameras, and scene composition in MuJoCo.',
    detail: 'Python package with runnable examples and a test suite.',
    tags: ['Python', 'MuJoCo', 'Motion planning'],
    href: 'https://github.com/vmstavens/mjsim',
    linkLabel: 'Explore the toolkit',
  },
  {
    id: 'biotac', category: 'Tactile sensing', title: 'BioTac simulation',
    description: 'A ROS and Gazebo plugin that generates tactile sensor data for a Shadow Dexterous Hand, with a neural-network model and a demonstration package.',
    detail: 'Builds on the TAMS BioTac simulation work.',
    tags: ['C++', 'ROS', 'Gazebo'],
    href: 'https://github.com/vmstavens/biotac_sim_plugin',
    linkLabel: 'View the plugin',
  },
  {
    id: 'hande', category: 'Robot model contribution', title: 'Robotiq Hand-E for MuJoCo',
    description: 'A Hand-E gripper model with coupled finger motion, collision geometry, and a ready-to-run scene for manipulation experiments.',
    detail: 'My Hand-E addition to a fork of Google DeepMind’s MuJoCo Menagerie.',
    tags: ['MJCF', 'Robot modeling', 'MuJoCo'],
    href: 'https://github.com/vmstavens/mujoco_menagerie_hande/tree/main/robotiq_hande',
    linkLabel: 'Explore the model',
  },
  {
    id: 'thesis', category: 'Research tools', title: 'A practical thesis toolkit',
    description: 'A structured LaTeX thesis template with tools for SVG figures, PDF compression, references, and automatic word counts.',
    detail: 'Small utilities that make technical writing easier.',
    tags: ['LaTeX', 'Scientific writing', 'CLI tools'],
    href: 'https://github.com/vmstavens/thesis-template',
    linkLabel: 'View the template',
  },
];
