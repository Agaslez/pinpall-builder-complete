export interface ChatImportResult {
  content: string;
  source: 'chatgpt' | 'grok' | 'deepseek' | 'claude' | 'raw';
  format: 'json' | 'text';
}

export class ChatImporter {
  /**
   * Import chat from JSON export (ChatGPT, DeepSeek, Grok standard exports)
   */
  async importFromJSON(jsonData: string | object): Promise<ChatImportResult> {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      
      // ChatGPT format
      if (data.conversations || (Array.isArray(data) && data[0]?.messages)) {
        return {
          content: this.parseChatGPTJSON(data),
          source: 'chatgpt',
          format: 'json',
        };
      }
      
      // DeepSeek/Grok format
      if (data.messages && Array.isArray(data.messages)) {
        return {
          content: this.parseMessagesJSON(data.messages),
          source: 'deepseek',
          format: 'json',
        };
      }
      
      // Claude format
      if (data.transcript || data.chat_history) {
        return {
          content: this.parseClaudeJSON(data),
          source: 'claude',
          format: 'json',
        };
      }
      
      throw new Error('Unknown JSON format');
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error}`);
    }
  }

  /**
   * Fetch chat from public URL and import
   */
  async importFromURL(url: string): Promise<ChatImportResult> {
    try {
      // Add proper headers to bypass 403
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': url,
        'Origin': new URL(url).origin,
      };

      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (response.status === 403) {
        throw new Error('Link do czatu musi być publiczny. Upewnij się że udostępniłeś go publicznie w ustawieniach.');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      
      // Try JSON first
      if (contentType?.includes('application/json')) {
        const json = await response.json();
        return this.importFromJSON(json);
      }

      // Try to extract from HTML (for web-based chat shares)
      const text = await response.text();
      
      // Try to find JSON in HTML (common pattern for web shares)
      const jsonMatch = text.match(/<script[^>]*>[\s\S]*?window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?})[\s\S]*?<\/script>/i);
      if (jsonMatch) {
        try {
          const json = JSON.parse(jsonMatch[1]);
          return this.importFromJSON(json);
        } catch (e) {
          // Continue to text parsing
        }
      }

      // Extract text content
      const cleaned = text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleaned || cleaned.length < 10) {
        throw new Error('Link nie zawiera treści czatu lub wymaga zalogowania');
      }

      return {
        content: cleaned,
        source: 'raw',
        format: 'text',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Nie udało się pobrać czatu: ${errorMsg}`);
    }
  }

  private parseChatGPTJSON(data: any): string {
    let content = '';
    
    if (Array.isArray(data.conversations)) {
      data.conversations.forEach((conv: any) => {
        if (conv.messages) {
          conv.messages.forEach((msg: any) => {
            content += `${msg.role || 'User'}: ${msg.content || msg.text || ''}\n\n`;
          });
        }
      });
    } else if (Array.isArray(data)) {
      data.forEach((item: any) => {
        if (item.messages) {
          item.messages.forEach((msg: any) => {
            content += `${msg.role || 'User'}: ${msg.content || msg.text || ''}\n\n`;
          });
        }
      });
    }
    
    return content;
  }

  private parseMessagesJSON(messages: any[]): string {
    let content = '';
    messages.forEach((msg: any) => {
      const role = msg.role || msg.author || 'User';
      const text = msg.content || msg.text || msg.message || '';
      content += `${role}: ${text}\n\n`;
    });
    return content;
  }

  private parseClaudeJSON(data: any): string {
    let content = '';
    
    const messages = data.messages || data.transcript || data.chat_history || [];
    
    if (Array.isArray(messages)) {
      messages.forEach((msg: any) => {
        if (typeof msg === 'string') {
          content += msg + '\n\n';
        } else {
          const role = msg.role || msg.author || 'User';
          const text = msg.content || msg.text || msg.message || '';
          content += `${role}: ${text}\n\n`;
        }
      });
    }
    
    return content;
  }
}
