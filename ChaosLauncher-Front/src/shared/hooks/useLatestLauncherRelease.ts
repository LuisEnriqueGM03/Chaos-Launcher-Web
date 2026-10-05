'use client';

import { useState, useEffect } from 'react';
import { ENV } from '../../core/config/env';

export interface LauncherReleaseInfo {
  version: string;
  downloadUrl: string;
  fileName: string;
  fileSizeMb: string;
  publishedAt: string;
  htmlUrl: string;
  isFallback: boolean;
}

const FALLBACK_RELEASE: LauncherReleaseInfo = {
  version: 'v1.1.0',
  downloadUrl: 'https://github.com/LuisEnriqueGM03/Chaos-Launcher-Esc/releases/download/v1.1.0/ChaosLauncher-Setup-1.1.0.exe',
  fileName: 'ChaosLauncher-Setup-1.1.0.exe',
  fileSizeMb: '86.0 MB',
  publishedAt: '2026-10-04',
  htmlUrl: 'https://github.com/LuisEnriqueGM03/Chaos-Launcher-Esc/releases/latest',
  isFallback: true,
};

const GITHUB_REPO = ENV.LAUNCHER_REPO;

export function useLatestLauncherRelease() {
  const [release, setRelease] = useState<LauncherReleaseInfo>(FALLBACK_RELEASE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchRelease() {
      try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (!res.ok) {
          throw new Error(`GitHub API error: ${res.status}`);
        }

        const data = await res.json();
        const assets: Array<{ name: string; browser_download_url: string; size: number }> = data.assets || [];

        // Priorizar el instalador .exe de Windows
        const exeAsset = assets.find((a) => a.name.toLowerCase().endsWith('.exe')) || assets[0];

        if (exeAsset && isMounted) {
          const sizeMb = exeAsset.size
            ? `${(exeAsset.size / (1024 * 1024)).toFixed(1)} MB`
            : FALLBACK_RELEASE.fileSizeMb;

          setRelease({
            version: data.tag_name || data.name || FALLBACK_RELEASE.version,
            downloadUrl: exeAsset.browser_download_url,
            fileName: exeAsset.name,
            fileSizeMb: sizeMb,
            publishedAt: data.published_at ? data.published_at.slice(0, 10) : FALLBACK_RELEASE.publishedAt,
            htmlUrl: data.html_url || FALLBACK_RELEASE.htmlUrl,
            isFallback: false,
          });
        }
      } catch (err) {
        // En caso de fallo o límite de GitHub API, mantenemos el fallback oficial v1.1.0
        console.warn('[useLatestLauncherRelease] Usando datos de release por defecto:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchRelease();

    return () => {
      isMounted = false;
    };
  }, []);

  return { release, loading };
}
