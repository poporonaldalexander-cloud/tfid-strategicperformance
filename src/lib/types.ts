export type StrategyMap = { id: string; name: string; order: number; status: string };
export type Outcome = { id: string; sm_id: string; code: string | null; name: string; description: string | null; status: string };
export type Accountability = { id: string; name: string; short: string | null; lead_person: string | null; status: string };
export type Program = { id: string; name: string; portfolio: string | null; acc_id: string | null; start_year: number | null; end_year: number | null; status: string };
export type AppUser = {
  email: string; name: string; role: string; dept: string | null;
  acc_id: string | null; can_edit: boolean; can_approve: boolean; status: string;
};
export type Indicator = {
  id: string; year: number; sm_id: string | null; outcome_id: string | null; acc_id: string | null;
  program_id: string | null; program_name: string | null; code: string | null; details: string | null;
  name: string; definition: string | null; unit: string | null; disaggregation: string | null;
  frequency: string | null; data_source: string | null; mov: string | null; calc_method: string | null;
  indicator_type: string | null; direction: string | null; pic: string | null;
  target_2030: number | null; target_2030_raw: string | null;
  target_year: number | null; target_year_raw: string | null;
  actual: number | null; actual_raw: string | null;
  ach_target_2030: number | null; ach_year: number | null;
  q1: number | null; q2: number | null; q3: number | null; q4: number | null;
  notes: string | null; key_initiatives: string | null; follow_up: string | null; status: string;
};

export type AppRole = 'admin' | 'pic' | 'viewer';

export type DB = {
  strategy_map: StrategyMap[];
  outcomes: Outcome[];
  accountability: Accountability[];
  programs: Program[];
  app_users: AppUser[];
  indicators: Indicator[];
};
