export interface DrillProgression {
  progression_name: string;
  progression_description: string;
  progression_image?: string;
}

export interface DrillData {
  name: string;
  description?: string;
  drill_steps: string[];
  coaching_focus_points: string[];
  shooter_focus_points?: string[];
  drill_progressions?: DrillProgression[];
  drill_image?: string;
  video?: string;
  drill_creation_date: string;
  drill_updated_date?: string;
  tags: {
    skill_level?: string[];
    team_drill?: string;
    age_level?: string[];
    fundamental_skill?: string[];
    skating_skill?: string[];
    equipment?: string[];
    game_situations?: string[];
  };
}
