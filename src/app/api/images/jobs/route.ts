/**
 * Image Generation Jobs API
 *
 * Tracks the status of image generation jobs for progress indicators.
 * Jobs are created when generation starts and updated as it progresses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface GenerationJob {
  id: string;
  content_id: string;
  type: 'single' | 'carousel' | 'composite';
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number;
  total_items: number;
  completed_items: number;
  current_step: string | null;
  error_message: string | null;
  error_code: string | null;
  error_details: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/**
 * GET - Fetch generation job(s) for a content item
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const jobId = searchParams.get('jobId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    if (jobId) {
      // Get specific job
      const { data: job, error } = await supabase
        .from('generation_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, job });
    }

    if (contentId) {
      // Get jobs for content
      let query = supabase
        .from('generation_jobs')
        .select('*')
        .eq('content_id', contentId)
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.in('status', ['pending', 'generating']);
      }

      const { data: jobs, error } = await query;

      if (error) {
        console.error('Error fetching jobs:', error);
        return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
      }

      return NextResponse.json({ success: true, jobs: jobs || [] });
    }

    // Get all active jobs (for polling multiple content items)
    const { data: jobs, error } = await supabase
      .from('generation_jobs')
      .select('*')
      .in('status', ['pending', 'generating'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active jobs:', error);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    return NextResponse.json({ success: true, jobs: jobs || [] });
  } catch (error) {
    console.error('Error in GET /api/images/jobs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new generation job
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      contentId,
      type,
      totalItems = 1,
      metadata = {},
    } = body;

    if (!contentId) {
      return NextResponse.json({ error: 'contentId is required' }, { status: 400 });
    }

    if (!type || !['single', 'carousel', 'composite'].includes(type)) {
      return NextResponse.json({ error: 'type must be single, carousel, or composite' }, { status: 400 });
    }

    // Create job record
    const { data: job, error } = await supabase
      .from('generation_jobs')
      .insert({
        content_id: contentId,
        type,
        status: 'pending',
        progress: 0,
        total_items: totalItems,
        completed_items: 0,
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating job:', error);
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error('Error in POST /api/images/jobs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update a generation job's status
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      jobId,
      status,
      progress,
      completedItems,
      currentStep,
      errorMessage,
      errorCode,
      errorDetails,
      metadata,
    } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    if (status !== undefined) updates.status = status;
    if (progress !== undefined) updates.progress = progress;
    if (completedItems !== undefined) updates.completed_items = completedItems;
    if (currentStep !== undefined) updates.current_step = currentStep;
    if (errorMessage !== undefined) updates.error_message = errorMessage;
    if (errorCode !== undefined) updates.error_code = errorCode;
    if (errorDetails !== undefined) updates.error_details = errorDetails;
    if (metadata !== undefined) updates.metadata = metadata;

    const { data: job, error } = await supabase
      .from('generation_jobs')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      console.error('Error updating job:', error);
      return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
    }

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error('Error in PATCH /api/images/jobs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a generation job (cleanup)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const contentId = searchParams.get('contentId');

    if (jobId) {
      const { error } = await supabase
        .from('generation_jobs')
        .delete()
        .eq('id', jobId);

      if (error) {
        console.error('Error deleting job:', error);
        return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (contentId) {
      // Delete all completed/failed jobs for content (cleanup)
      const { error } = await supabase
        .from('generation_jobs')
        .delete()
        .eq('content_id', contentId)
        .in('status', ['completed', 'failed']);

      if (error) {
        console.error('Error deleting jobs:', error);
        return NextResponse.json({ error: 'Failed to delete jobs' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'jobId or contentId is required' }, { status: 400 });
  } catch (error) {
    console.error('Error in DELETE /api/images/jobs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
