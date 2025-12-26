'use client';
import { updateLeague } from '@/actions/league';
import { League } from '@/app/types';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Field } from './ui/field';
import { toast } from './ui/toaster';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

export default function LeagueInfo({ league }: { league: League }) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm({
        defaultValues: {
            name: league.name,
            description: league.description || ''
        }
    });

    const onSubmit = useCallback(
        async (data: { name: string; description: string }) => {
            const result = await updateLeague({
                league_id: league.id,
                name: data.name,
                description: data.description
            });

            if (result.error) {
                toast.error(result.error.message);
            } else {
                toast.success('League updated successfully');
            }
        },
        [league.id]
    );

    return (
        <div>
            <h2 className="text-2xl font-light mb-5 ml-2">League Information</h2>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-md p-4">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <fieldset>
                        <Field label="League Name" errorText={errors.name?.message}>
                            <Input {...register('name', { required: 'Name is required' })} />
                        </Field>

                        <Field label="Description" >
                            <Textarea
                                {...register('description')}
                                rows={4}
                                placeholder="Optional league description"
                            />
                        </Field>

                        <Button type="submit" disabled={isSubmitting} className="mt-4">
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </fieldset>
                </form>
            </div>
        </div>
    );
}
