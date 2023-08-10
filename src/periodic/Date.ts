import { moment } from 'obsidian';
import type { File } from './File';
import type { App } from 'obsidian';
import type { DateType, DateRangeType, PluginSettings } from '../type';

export class Date {
  app: App;
  settings: PluginSettings;
  file: File;
  constructor(app: App, settings: PluginSettings, file: File) {
    this.app = app;
    this.file = file;
    this.settings = settings;
  }
  parse(path = ''): DateType {
    const fileName = this.app.vault.getAbstractFileByPath(path)?.name;

    const [[, year], [, quarter], [, month], [, week], [, day]] = [
      fileName?.match(/(^\d{4})/) || [], // year
      fileName?.match(/^\d{4}-Q(\d{1})/) || [], // quarter
      fileName?.match(/^\d{4}-(\d{2})/) || [], // month
      fileName?.match(/^\d{4}-W(\d{2})/) || [], // week
      fileName?.match(/^\d{4}-\d{2}-(\d{2})/) || [], // day
    ];

    return {
      year: Number.isNaN(Number(year)) ? null : Number(year),
      month: Number.isNaN(Number(month)) ? null : Number(month),
      quarter: Number.isNaN(Number(quarter)) ? null : Number(quarter),
      week: Number.isNaN(Number(week)) ? null : Number(week),
      day: Number.isNaN(Number(day)) ? null : Number(day),
    };
  }

  lastDay(
    parsed: DateType = {
      year: null,
      month: null,
      quarter: null,
      week: null,
      day: null,
    }
  ) {
    const { year, quarter, month, week } = parsed;

    return {
      year: year ? moment().year(year).endOf('year').format('YYYY-MM-DD') : '',
      quarter:
        quarter && year
          ? moment()
              .year(year)
              .quarter(quarter)
              .endOf('quarter')
              .format('YYYY-MM-DD')
          : '',
      month:
        month && year
          ? moment()
              .year(year)
              .month(month - 1)
              .endOf('month')
              .format('YYYY-MM-DD')
          : '',
      week:
        week && year
          ? moment().year(year).week(week).endOf('week').format('YYYY-MM-DD')
          : '',
    };
  }

  days(
    parsed: DateType = {
      year: null,
      month: null,
      quarter: null,
      week: null,
      day: null,
    }
  ): DateRangeType {
    // parse 之后，从 day 开始，依次判断周、月、季、年，给出 from 和 to
    const { year, quarter, month, week, day } = parsed;

    if (day) {
      const today = `${year}-${String(month).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`;

      return {
        from: today,
        to: today,
      };
    }

    if (week) {
      const from = year
        ? moment().year(year).week(week).startOf('week').format('YYYY-MM-DD')
        : null;
      const to = year
        ? moment().year(year).week(week).endOf('week').format('YYYY-MM-DD')
        : null;

      return {
        from,
        to,
      };
    }

    if (month) {
      const from = year
        ? moment()
            .year(year)
            .month(month - 1)
            .startOf('month')
            .format('YYYY-MM-DD')
        : null;
      const to = year
        ? moment()
            .year(year)
            .month(month - 1)
            .endOf('month')
            .format('YYYY-MM-DD')
        : null;

      return {
        from,
        to,
      };
    }

    if (quarter) {
      const from = year
        ? moment()
            .year(year)
            .quarter(quarter)
            .startOf('quarter')
            .format('YYYY-MM-DD')
        : null;
      const to = year
        ? moment()
            .year(year)
            .quarter(quarter)
            .endOf('quarter')
            .format('YYYY-MM-DD')
        : null;

      return {
        from,
        to,
      };
    }

    if (year) {
      const from = moment().year(year).startOf('year').format('YYYY-MM-DD');
      const to = moment().year(year).endOf('year').format('YYYY-MM-DD');

      return {
        from,
        to,
      };
    }

    return {
      from: null,
      to: null,
    };
  }

  files(
    parsed: DateType = {
      year: null,
      month: null,
      quarter: null,
      week: null,
      day: null,
    }
  ) {
    // 获取指定日期范围内的 weeks，quarters 和 months，并去重
    const { from, to } = this.days(parsed);
    const weeks = new Set();
    const months = new Set();
    const quarters = new Set();

    const currentDate = moment(from).clone();

    while (currentDate.isBefore(moment(to))) {
      const weekLink = `${currentDate.weekYear()}-W${String(
        currentDate.isoWeek()
      ).padStart(2, '0')}.md`;
      const weekFile = this.file.get(
        weekLink,
        '',
        this.settings.periodicNotesPath
      );

      if (weekFile) {
        weeks.add(weekFile.path);
      }

      const monthLink = `${currentDate.year()}-${String(
        currentDate.month() + 1
      ).padStart(2, '0')}.md`;
      const monthFile = this.file.get(
        monthLink,
        '',
        this.settings.periodicNotesPath
      );

      if (monthFile) {
        months.add(monthFile.path);
      }

      const quarterLink = `${currentDate.year()}-Q${Math.ceil(
        (currentDate.month() + 1) / 3
      )}.md`;
      const quarterFile = this.file.get(
        quarterLink,
        '',
        this.settings.periodicNotesPath
      );

      if (quarterFile) {
        quarters.add(quarterFile.path);
      }

      currentDate.add(1, 'day');
    }

    return {
      weeks: parsed.month ? Array.from(weeks) : [],
      months: parsed.quarter ? Array.from(months) : [],
      quarters:
        parsed.year && !parsed.month && !parsed.quarter && !parsed.week
          ? Array.from(quarters)
          : [],
    };
  }
}
