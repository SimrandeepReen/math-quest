export const SKILLS = ['addition','subtraction','crossing_addition','crossing_subtraction','inverse','mixed'] as const;
export type Skill = typeof SKILLS[number];
export type Stage = 'auto' | 'A' | 'B' | 'C';
export type Step = { op: '+' | '-'; amount: number };
export type Challenge = { id: string; skill: Skill; difficulty: number; start: number; steps: Step[]; answer: number; inverse: boolean };
export type Attempt = { firstTry: boolean; retries: number; hints: number; seconds: number };
export type SkillProgress = { attempts: number; firstTry: number; retries: number; hints: number; totalSeconds: number; difficulty: number; recent: Attempt[] };
export type Progress = Partial<Record<Skill,SkillProgress>>;
export const blankSkill = (): SkillProgress => ({attempts:0,firstTry:0,retries:0,hints:0,totalSeconds:0,difficulty:1,recent:[]});
