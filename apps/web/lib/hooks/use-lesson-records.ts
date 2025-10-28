import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type CreateLessonRecordRequest,
  type AnalysisGroup,
  type PracticeSkill,
  type Ability,
  type CreateCoachRatingsRequest,
  type LatestRating
} from '../api/client';

export function useCreateLessonRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLessonRecordRequest) => api.lessonRecords.create(data),
    onSuccess: () => {
      // Invalidate lesson records list
      queryClient.invalidateQueries({ queryKey: ['lessonRecords', 'private'] });
    }
  });
}

export function usePrivateLessonRecords() {
  return useQuery({
    queryKey: ['lessonRecords', 'private'],
    queryFn: () => api.lessonRecords.listPrivate()
  });
}

export function useLessonRecordsForLesson(lessonId: number) {
  const { data: allRecords, ...rest } = usePrivateLessonRecords();

  const lessonRecords = allRecords?.filter(record => record.lessonId === lessonId) || [];

  return {
    data: lessonRecords,
    ...rest
  };
}

export function useAnalysisGroups() {
  return useQuery({
    queryKey: ['analysisGroups'],
    queryFn: () => api.analysis.getGroups(),
    staleTime: 5 * 60 * 1000 // 5 minutes - this data rarely changes
  });
}

export function usePracticeSkills() {
  return useQuery({
    queryKey: ['practiceSkills'],
    queryFn: () => api.practice.getSkills(),
    staleTime: 5 * 60 * 1000 // 5 minutes - this data rarely changes
  });
}

export function useAbilities() {
  return useQuery({
    queryKey: ['abilities'],
    queryFn: () => api.abilities.getAll(),
    staleTime: 10 * 60 * 1000 // 10 minutes - this data rarely changes
  });
}

export function useLatestRatings(mappingId: string) {
  return useQuery({
    queryKey: ['latestRatings', mappingId],
    queryFn: () => api.ratings.getLatest(mappingId),
    enabled: !!mappingId
  });
}

export function useCreateCoachRatings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCoachRatingsRequest) => api.ratings.create(data),
    onSuccess: (_, variables) => {
      // Invalidate ratings for the student
      if (variables.ratings.length > 0) {
        // Extract mappingId from lessonRecordDetailId if needed
        queryClient.invalidateQueries({ queryKey: ['latestRatings'] });
      }
    }
  });
}
