import { useState } from "react";
import { Key, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface ApiKeyInputProps {
  onApiKeySet: (apiKey: string) => void;
  currentApiKey?: string;
}

export function ApiKeyInput({ onApiKeySet, currentApiKey }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState(currentApiKey || "");

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openai_api_key', apiKey.trim());
      onApiKeySet(apiKey.trim());
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          OpenAI API Key Required
        </CardTitle>
        <CardDescription>
          To generate comprehensive analysis, please enter your OpenAI API key. It will be stored locally in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        <Button onClick={handleSave} disabled={!apiKey.trim()} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          Save API Key
        </Button>
      </CardContent>
    </Card>
  );
}