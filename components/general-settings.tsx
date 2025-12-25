'use client';
import { League } from '@/app/types';

export default function GeneralSettings({ league }: { league: League }) {
    return (
        <div>
            <h2 className="text-2xl font-light mb-5 ml-2">General Settings</h2>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-md p-4">
                <p className="text-gray-600 dark:text-gray-400">
                    Additional league preferences will be available here in future updates.
                </p>
            </div>
        </div>
    );
}
