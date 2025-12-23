'use client';
import { updateLeague } from '@/actions/league';
import { League } from '@/app/types';
import { Box, Button, Fieldset, Heading, Input, Textarea } from '@chakra-ui/react';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Field } from './ui/field';
import { toaster } from './ui/toaster';

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
                toaster.create({
                    type: 'error',
                    title: result.error.message
                });
            } else {
                toaster.create({
                    type: 'success',
                    title: 'League updated successfully'
                });
            }
        },
        [league.id]
    );

    return (
        <Box>
            <Heading mb="20px" fontWeight={100} ml={'10px'}>
                League Information
            </Heading>
            <Box
                style={{ background: 'rgba(255, 255, 255, 0.5)', borderRadius: '8px' }}
                boxShadow="md"
                p={4}
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Fieldset.Root>
                        <Field label="League Name" invalid={!!errors.name} errorText={errors.name?.message}>
                            <Input {...register('name', { required: 'Name is required' })} />
                        </Field>

                        <Field label="Description" invalid={!!errors.description}>
                            <Textarea
                                {...register('description')}
                                rows={4}
                                placeholder="Optional league description"
                            />
                        </Field>

                        <Button type="submit" disabled={isSubmitting} mt={4}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </Fieldset.Root>
                </form>
            </Box>
        </Box>
    );
}
