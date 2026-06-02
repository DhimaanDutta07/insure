// DateFormatter.ts
export const formatDate = (
    dateString: string | null,
    format: 'short' | 'withTime' | 'monthYear' = 'short'
  ): string => {
    if (!dateString) return "N/A";
  
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
  
    const pad = (num: number) => String(num).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
    const day = pad(date.getDate());
    const month = months[date.getMonth()];
    const year = date.getFullYear();
  
    switch (format) {
      case 'short':
        return `${day}-${month}-${year}`; // 02-Apr-2025
      case 'withTime': {
        let hours = date.getHours();
        const minutes = pad(date.getMinutes());
        const period = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        const formattedHours = pad(hours);
        return `${day}-${month}-${year} ${formattedHours}:${minutes} ${period}`; // 02-Apr-2025 02:30 PM
      }
      case 'monthYear':
        return `${month}-${year}`; // Apr 2025
      default:
        return `${day}-${month}-${year}`; // Default to short format
    }
  };