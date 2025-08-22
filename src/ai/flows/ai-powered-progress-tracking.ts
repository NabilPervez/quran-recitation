'use server';

/**
 * @fileOverview AI-powered progress tracking for Quran memorization.
 *
 * - trackMemorizationProgress - A function that analyzes user repetition patterns,
 *   identifies difficult verses, and recommends tailored learning strategies.
 * - TrackMemorizationProgressInput - The input type for the trackMemorizationProgress function.
 * - TrackMemorizationProgressOutput - The return type for the trackMemorizationProgress function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TrackMemorizationProgressInputSchema = z.object({
  userId: z.string().describe('The unique identifier for the user.'),
  surahNo: z.number().describe('The surah number being memorized.'),
  ayahNo: z.number().describe('The ayah number currently being recited.'),
  repetitionCount: z.number().describe('The number of times the ayah has been repeated.'),
  errorRate: z.number().describe('The error rate during recitation (0 to 1).'),
});
export type TrackMemorizationProgressInput = z.infer<typeof TrackMemorizationProgressInputSchema>;

const TrackMemorizationProgressOutputSchema = z.object({
  difficultVerses: z.array(z.number()).describe('Array of difficult ayah numbers.'),
  recommendedStrategies: z.array(z.string()).describe('Array of recommended learning strategies.'),
  progressPercentage: z.number().describe('Overall memorization progress percentage.'),
});
export type TrackMemorizationProgressOutput = z.infer<typeof TrackMemorizationProgressOutputSchema>;

export async function trackMemorizationProgress(input: TrackMemorizationProgressInput): Promise<TrackMemorizationProgressOutput> {
  return trackMemorizationProgressFlow(input);
}

const prompt = ai.definePrompt({
  name: 'trackMemorizationProgressPrompt',
  input: {schema: TrackMemorizationProgressInputSchema},
  output: {schema: TrackMemorizationProgressOutputSchema},
  prompt: `You are an AI assistant designed to track a user's Quran memorization progress and provide personalized recommendations.

Analyze the user's repetition patterns, identify difficult verses, and suggest tailored learning strategies to optimize their memorization effectiveness.

User ID: {{{userId}}}
Surah Number: {{{surahNo}}}
Ayah Number: {{{ayahNo}}}
Repetition Count: {{{repetitionCount}}}
Error Rate: {{{errorRate}}}

Based on this data, provide the following:

- A list of difficult verses (difficultVerses).
- A list of recommended learning strategies (recommendedStrategies).
- An overall memorization progress percentage (progressPercentage).

Ensure the output is accurate, helpful, and tailored to the user's specific needs.
`,
});

const trackMemorizationProgressFlow = ai.defineFlow(
  {
    name: 'trackMemorizationProgressFlow',
    inputSchema: TrackMemorizationProgressInputSchema,
    outputSchema: TrackMemorizationProgressOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
