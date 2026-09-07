import defaults from '../config/school-topics.json';
import { SKILLS, type Skill } from './types';
export type TopicConfig = Record<string, Record<string, boolean>>;
export const topicKeys: Record<Skill,string> = {addition:'addition_to_20',subtraction:'subtraction_to_20',crossing_addition:'crossing_ten_addition',crossing_subtraction:'crossing_ten_subtraction',inverse:'inverse_relationships',mixed:'mixed_expressions'};
export const skillLabels: Record<Skill,string> = {addition:'Addition within 20',subtraction:'Subtraction within 20',crossing_addition:'Addition across 10',crossing_subtraction:'Subtraction across 10',inverse:'Missing number relationships',mixed:'Mixed addition & subtraction'};
export function parseTopics(input: unknown): TopicConfig {
  const result: TopicConfig = {};
  for(const [domain,values] of Object.entries(defaults)) if(typeof values==='object') result[domain]={...values};
  if(input && typeof input==='object') for(const [domain,values] of Object.entries(input)) {
    if(!values || typeof values!=='object' || Array.isArray(values) || ['__proto__','constructor','prototype'].includes(domain)) continue;
    result[domain]??={};
    for(const [key,value] of Object.entries(values)) if(typeof value==='boolean' && !['__proto__','constructor','prototype'].includes(key)) result[domain][key]=value;
  }
  return result;
}
export const enabledSkills = (topics: TopicConfig) => SKILLS.filter(s=>topics.math?.[topicKeys[s]]===true);
