import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TeamMember {
  name:        string;
  role:        string;
  description: string;
  image:       string;
  skills:      string[];
  social:      { github?: string; linkedin?: string; email?: string };
  badge:       string;
  badgeColor:  string;
  cardColor:   string;
  glowColor:   string;
}

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css'],
})
export class TeamComponent {

  supervisor: TeamMember = {
    name:        'Dr. Hayat Ali Shah',
    role:        'Project Supervisor — School of Natural Sciences, NUST',
    description: 'Dr. Hayat is a distinguished professor with a research focus in AI, Machine Learning, Bioinformatics, and Data Science. Under his mentorship, this project has matured into a dynamic blend of academic research and real-world application.',
    image:       'assets/supervisor.png',
    skills:      ['Artificial Intelligence', 'Machine Learning', 'Bioinformatics', 'Data Science'],
    social:      {
      linkedin: 'https://scholar.google.com/citations?user=yhOlwwkAAAAJ&hl=en',
      email:    'hayat.ali@sns.nust.edu.pk'
    },
    badge:       'Supervisor',
    badgeColor:  'linear-gradient(135deg,#7c3aed,#8b5cf6)',
    cardColor:   'linear-gradient(145deg,#2e1065,#4c1d95)',
    glowColor:   'rgba(139,92,246,0.45)',
  };

  members: TeamMember[] = [
    {
      name:        'Muhammad Mohsin',
      role:        'Frontend Developer & Data Engineer',
      description: 'A developer with a vision for smarter SEO. Mohsin specializes in AI-powered SEO algorithms, intuitive interfaces, and robust data integration. He bridges design and data to create a seamless user experience.',
      image:       'assets/mohsin.png',
      skills:      ['Frontend Development', 'SEO Analytics', 'Database Design', 'API Development', 'Semantic SEO Engineering'],
      social:      {
        github:   '#',
        linkedin: '#',
        email:    'mohsin.bsmaths22sns@student.nust.edu.pk'
      },
      badge:      'Frontend Lead',
      badgeColor: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
      cardColor:  'linear-gradient(145deg,#0c1a4a,#1e3a5f)',
      glowColor:  'rgba(59,130,246,0.45)',
    },
    {
      name:        'Zeeshan Haider',
      role:        'Lead Developer & AI Specialist',
      description: 'The architect behind our intelligent systems. Zeeshan leads backend development and AI integration, focusing on scalable infrastructure and deep learning solutions that power real-time SEO insights.',
      image:       'assets/zeeshan.png',
      skills:      ['Backend Development', 'Machine Learning & Deep Learning', 'Scalable System Design', 'Big Data Processing'],
      social:      {
        github:   '#',
        linkedin: '#',
        email:    'zeeshan.bsmaths22sns@student.nust.edu.pk'
      },
      badge:      'AI Engineer',
      badgeColor: 'linear-gradient(135deg,#15803d,#22c55e)',
      cardColor:  'linear-gradient(145deg,#052e16,#14532d)',
      glowColor:  'rgba(34,197,94,0.45)',
    },
    {
      name:        'Ehtisham Ali',
      role:        'Expert Mathematician & Academic Writer',
      description: 'Combining mathematical theory with practical SEO strategies, Ehtisham leads user research and case study development. His analytical mindset helps bridge the gap between theoretical models and business applications.',
      image:       'assets/ehtisham.png',
      skills:      ['Mathematical Modeling', 'User Research', 'SEO-Driven Algorithm Design', 'Academic Writing'],
      social:      {
        github:   '#',
        linkedin: '#',
        email:    'ehtisham.bsmaths22sns@student.nust.edu.pk'
      },
      badge:      'Backend Lead',
      badgeColor: 'linear-gradient(135deg,#b45309,#f59e0b)',
      cardColor:  'linear-gradient(145deg,#451a03,#78350f)',
      glowColor:  'rgba(245,158,11,0.45)',
    },
  ];
}