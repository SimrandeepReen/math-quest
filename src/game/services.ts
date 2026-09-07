import { SaveStore } from '../persistence/SaveStore';
import { AudioManager } from '../audio/AudioManager';
import { LearningEngine } from '../learning/LearningEngine';
export const save=new SaveStore();
export const audio=new AudioManager();
export const learning=()=>new LearningEngine(save.data.skills,save.data.topics,save.data.preferences.adaptive,save.data.preferences.stage);
