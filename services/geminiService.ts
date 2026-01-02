
import { GoogleGenAI } from "@google/genai";
import { Activity, Board } from "../types";
import { format, addMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

export const generateMonthlyReport = async (activities: Activity[], monthDate: Date): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const currentMonthStart = startOfMonth(monthDate);
  const currentMonthEnd = endOfMonth(monthDate);
  const nextMonthStart = startOfMonth(addMonths(monthDate, 1));
  const nextMonthEnd = endOfMonth(addMonths(monthDate, 1));

  const filterActivities = (rangeStart: Date, rangeEnd: Date) => {
    return activities.filter(a => {
      const start = parseISO(a.startDate);
      const end = parseISO(a.endDate);
      
      // Activity overlaps with the month if its start or end is within the month,
      // or if it spans across the entire month.
      return (
        (start >= rangeStart && start <= rangeEnd) ||
        (end >= rangeStart && end <= rangeEnd) ||
        (start <= rangeStart && end >= rangeEnd)
      );
    });
  };

  const currentMonthActivities = filterActivities(currentMonthStart, currentMonthEnd);
  const nextMonthActivities = filterActivities(nextMonthStart, nextMonthEnd);

  const monthName = format(monthDate, 'MMMM yyyy').toUpperCase();

  const prompt = `
    Generate a professional CMDA-UCTH Monthly Activity Report based on these lists:
    Current Month (${monthName}): ${JSON.stringify(currentMonthActivities)}
    Next Month: ${JSON.stringify(nextMonthActivities)}

    Strictly follow this formatting template:
    - ACTIVITIES FOR THE MONTH OF ${monthName}
    PRAYER DEPARTMENT (RAPHA-LIFELINE): [Activity Name] from [Start Date] to [End Date]
    MISSIONS DEPARTMENT (WHOLENESS MISSIONS): [Activity Name] from [Start Date] to [End Date]
    ACADEMIC DEPARTMENT (EXCEL): [Activity Name] from [Start Date] to [End Date]
    OTHER ACTIVITIES: [Summary of all other boards, noting their date ranges]
    UPCOMING ACTIVITIES: [Next Month's list grouped simply by board with date ranges]

    If a department has no activities, mark it as "None scheduled".
    If an activity is a single day (Start Date equals End Date), just use "[Activity Name] on [Date]".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Failed to generate report.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating report with Gemini.";
  }
};
