export interface DrillData {
  name: string;
  description: string;
  coaching_points: string[];
  images: string[];
  video?: string;
  drill_creation_date: string;
  drill_updated_date?: string;
  tags: {
    skill_level?: string[];
    team_drill?: string[];
    age_level?: string[];
    fundamental_skill?: string[];
    skating_skill?: string[];
    equipment?: string[];
  };
}
