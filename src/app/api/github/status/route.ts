import { NextResponse } from 'next/server';
import { isGitHubConfigured } from '@/lib/github';

export async function GET() {
  return NextResponse.json({
    configured: isGitHubConfigured(),
    owner: process.env.GITHUB_OWNER || null,
    repo: process.env.GITHUB_REPO || null,
    branch: process.env.GITHUB_BRANCH || 'main',
  });
}
