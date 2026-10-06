import { useEffect } from 'react';

const PRODUCT = 'TranscribeBoard';

/** Names the browser tab after the page, e.g. "Kickoff call \u00b7 TranscribeBoard". */
export function usePageTitle(page?: string | null): void {
  useEffect(() => {
    document.title = page ? `${page} \u00b7 ${PRODUCT}` : `${PRODUCT} \u00b7 Meeting to Kanban AI`;
  }, [page]);
}
