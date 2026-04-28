export type ContributionDay = {
  date: string;
  level: number;
};

export type ContributionMonth = {
  label: string;
  start: number;
  span: number;
};

export type ContributionCalendarData = {
  total: number;
  username: string;
  weeks: ContributionDay[][];
  months: ContributionMonth[];
};
