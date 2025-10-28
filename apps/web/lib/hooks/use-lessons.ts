import { useQuery } from '@tanstack/react-query';
import { api, type Lesson, type LessonDetail, type Seat } from '../api/client';

export function useLessons(params?: { role?: 'coach' | 'student'; date?: string }) {
  return useQuery({
    queryKey: ['lessons', params],
    queryFn: () => api.lessons.list(params)
  });
}

export function useLesson(id: number) {
  return useQuery({
    queryKey: ['lessons', id],
    queryFn: () => api.lessons.getById(id),
    enabled: !!id
  });
}

export function useLessonSeats(id: number, includeSelfEval: boolean = false) {
  return useQuery({
    queryKey: ['lessons', id, 'seats', { includeSelfEval }],
    queryFn: () => api.lessons.getSeats(id, includeSelfEval),
    enabled: !!id
  });
}
