const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export interface DocumentMetadataResponse {
  success: boolean;
  data: {
    document_id: string;
    file_name: string;
    original_name: string;
    relative_path: string;
    file_type: string;
    category: string;
    created_at: string;
    expires_at: string;
  };
}

// Cache document URLs to avoid repeated API calls
const urlCache = new Map<string, { url: string; expires: number }>();

export const documentService = {
  async getDocumentUrl(documentId: string): Promise<string | null> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('[DocumentService] No authentication token found');
        return null;
      }

      console.log(`[DocumentService] Fetching metadata for document: ${documentId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}/url`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`[DocumentService] Failed to get document metadata: ${response.status} ${response.statusText}`);
        
        // Log more details about the error
        try {
          const errorText = await response.text();
          console.error(`[DocumentService] Error response:`, errorText);
        } catch {
          console.error(`[DocumentService] Could not read error response`);
        }
        
        return null;
      }

      const result: DocumentMetadataResponse = await response.json();
      
      console.log(`[DocumentService] Backend metadata response:`, result);
      
      if (result.success && result.data?.relative_path) {
        // Construct URL using VITE_BASE_URL and relative_path
        const constructedUrl = this.constructDocumentUrl(result.data.relative_path);
        console.log(`[DocumentService] Constructed URL: ${constructedUrl}`);
        return constructedUrl;
      }
      
      console.error('[DocumentService] Invalid response format or no relative_path in response:', result);
      return null;
    } catch (error) {
      console.error('[DocumentService] Network or parsing error:', error);
      return null;
    }
  },

  constructDocumentUrl(relativePath: string): string {
    if (!relativePath) {
      throw new Error('Relative path is required to construct document URL');
    }

    let cleanPath = relativePath;
    
    // Remove the API prefix if it exists
    if (cleanPath.startsWith('/api/v1/uploads/')) {
      cleanPath = cleanPath.substring('/api/v1/uploads/'.length);
    } else if (cleanPath.startsWith('/api/uploads/')) {
      cleanPath = cleanPath.substring('/api/uploads/'.length);
    }
    
    // If the path already starts with policy-documents/, use it as is
    let finalPath: string;
    if (cleanPath.startsWith('policy-documents/')) {
      finalPath = `/api/v1/uploads/${cleanPath}`;
    } else {
      // Otherwise, prepend policy-documents/
      finalPath = `/api/v1/uploads/policy-documents/${cleanPath}`;
    }
    
    // Use VITE_BASE_URL for the full URL construction
    const fullUrl = `${API_BASE_URL}${finalPath}`;
    
    console.log(`[DocumentService] URL construction:`, {
      originalPath: relativePath,
      cleanPath,
      finalPath,
      baseUrl: API_BASE_URL,
      fullUrl
    });
    
    return fullUrl;
  },

  async getCachedDocumentUrl(documentId: string): Promise<string | null> {
    // Check cache first
    const cached = urlCache.get(documentId);
    if (cached && Date.now() < cached.expires) {
      console.log(`[DocumentService] Using cached URL for document: ${documentId}`);
      return cached.url;
    }

    // Fetch from API
    console.log(`[DocumentService] Cache miss, fetching from API for document: ${documentId}`);
    const url = await this.getDocumentUrl(documentId);
    if (url) {
      // Cache for 1 hour
      urlCache.set(documentId, {
        url,
        expires: Date.now() + 60 * 60 * 1000
      });
      console.log(`[DocumentService] Cached URL for document: ${documentId}`);
    }

    return url;
  },

  clearCache() {
    urlCache.clear();
  }
};
