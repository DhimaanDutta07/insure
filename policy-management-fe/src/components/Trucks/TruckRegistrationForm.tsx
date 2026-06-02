/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import axios from 'axios';

interface TokenResponse {
    data:{
  token: string;
}
}

const TruckRegistrationForm: React.FC = () => {
  const [truckNumber, setTruckNumber] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [truckPhoto, setTruckPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Handle truck number input change with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (truckNumber.trim().length > 2) {
        fetchTruckSuggestions();
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [truckNumber]);

  const fetchTruckSuggestions = async (): Promise<void> => {
    try {
      const response = await axios.get<string[]>(`${import.meta.env.VITE_BASE_URL}/api/v1/po/associated/truck?query=${truckNumber}`);
      // const response = await axios.get<string[]>(`http://139.59.28.237/api/v1/po/associated/truck?query=${truckNumber}`);

      setSuggestions(response.data || []);
    } catch (error) {
      console.error('Error fetching truck suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleTruckNumberChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setTruckNumber(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string): void => {
    setTruckNumber(suggestion);
    setSuggestions([]);
  };

  const handleGenerateToken = async (): Promise<void> => {
    setIsLoading(true);
    setError('');
    
    try {
      // const response = await axios.get<TokenResponse>('http://139.59.28.237/api/v1/truck/token/generate');
      const response = await axios.get<TokenResponse>(`${import.meta.env.VITE_BASE_URL}/api/v1/truck/token/generate`);

      console.log(response.data.data.token)
      setToken(response.data.data.token || '');
    } catch (error) {
      console.error('Error generating token:', error);
      setError('Failed to generate token. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setTruckPhoto(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoAreaClick = (): void => {
    if (photoInputRef.current) {
      photoInputRef.current.click();
    }
  };

  const handleRegisterTruck = async (): Promise<void> => {
    if (!truckNumber.trim()) {
      setError('Please enter a truck number');
      return;
    }

    if (!token) {
      setError('Please generate a token first');
      return;
    }

    if (!truckPhoto) {
      setError('Please upload a truck photo');
      return;
    }

    setIsLoading(true);
    setError('');

    const userId = "89c3e26d-1256-46c5-a64b-742a037016fa"
    // const userId = "9f648245-53f5-42e6-af9f-f02472d51c38"


    const formData = new FormData();
    formData.append('truck_number', truckNumber);
    formData.append('token', token);
    formData.append('photo', truckPhoto);
    formData.append("inspected_by" , userId)

    try {
      // await axios.post('http://139.59.28.237/api/v1/truck-reg/entry', formData, {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/v1/truck-reg/entry`, formData, {

        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Reset the form after successful submission
      setTruckNumber('');
      setToken('');
      setTruckPhoto(null);
      setPhotoPreview(null);
      
      alert('Truck registered successfully!');
    } catch (error) {
      console.error('Error registering truck:', error);
      setError('Failed to register truck. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format current time in HH:MM:SS
  const getCurrentTime = (): string => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-md rounded-md p-6">
      <div className="flex justify-end text-gray-500 text-sm mb-4">
        {getCurrentTime()}
      </div>
      
      <div className="mb-4">
        <label htmlFor="truckNumber" className="block text-gray-700 font-medium mb-2">
          Truck Number
        </label>
        <div className="relative">
          <input
            type="text"
            id="truckNumber"
            placeholder="e.g., DL04C1969"
            value={truckNumber}
            onChange={handleTruckNumberChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Token
        </label>
        <div className="flex items-center">
          <div className="flex-grow text-gray-500">
            {token ? token : 'No token generated yet'}
          </div>
          <button
            onClick={handleGenerateToken}
            disabled={isLoading}
            className="ml-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Generate Token'}
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          Truck Photo
        </label>
        <div
          onClick={handlePhotoAreaClick}
          className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Truck preview" className="max-h-32 mb-2" />
          ) : (
            <>
              <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18" />
              </svg>
              <p className="text-sm text-gray-500">Tap to upload photo</p>
            </>
          )}
        </div>
        <input
          type="file"
          ref={photoInputRef}
          onChange={handlePhotoUpload}
          accept="image/*"
          className="hidden"
        />
      </div>
      
      {error && (
        <div className="mb-4 text-red-500 text-sm">
          {error}
        </div>
      )}
      
      <button
        onClick={handleRegisterTruck}
        disabled={isLoading}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : 'Register Truck'}
      </button>
    </div>
  );
};

export default TruckRegistrationForm;