'use client';

import { Button, Input, Stack, Text } from '@chakra-ui/react';
import {
    DialogRoot,
    DialogActionTrigger,
    DialogBody,
    DialogCloseTrigger,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from './ui/dialog';
import { Field } from './ui/field';
import { useForm, useFieldArray } from 'react-hook-form';
import { createLeague } from '@/actions/league';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from 'next/navigation';
import { useLeagues } from '@/app/hooks';
import { useState } from 'react';

interface CreateLeagueForm {
    name: string;
    description: string;
    members: { email: string }[];
}

export default function CreateLeagueDialog() {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const { refresh } = useLeagues();

    const {
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
        reset
    } = useForm<CreateLeagueForm>({
        defaultValues: {
            name: '',
            description: '',
            members: [{ email: '' }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'members'
    });

    const onSubmit = async (data: CreateLeagueForm) => {
        // Extract member emails, filter empty ones
        const member_emails = data.members
            .map(m => m.email.trim())
            .filter(email => email.length > 0);

        const result = await createLeague({
            name: data.name,
            description: data.description || undefined,
            member_emails: member_emails.length > 0 ? member_emails : undefined
        });

        if (result.error) {
            toaster.create({
                title: result.error.message,
                type: 'error'
            });
            return;
        }

        toaster.create({
            title: 'League created successfully',
            type: 'success'
        });

        // Refresh leagues list
        await refresh();

        // Close dialog
        setOpen(false);

        // Reset form for next use
        reset();

        // Navigate to new league page
        router.push(`/leagues/${result.data.id}`);
    };

    return (
        <DialogRoot
            open={open}
            onOpenChange={(e) => setOpen(e.open)}
            size="md"
            placement="center"
        >
            <DialogTrigger asChild>
                <Button variant="solid" colorScheme="blue">
                    Create New League
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>Create New League</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <Stack gap={4}>
                            {/* League Name Field */}
                            <Field
                                label="League Name"
                                required
                                errorText={errors.name?.message}
                            >
                                <Input
                                    placeholder="Enter league name"
                                    {...control.register('name', {
                                        required: 'League name is required',
                                        minLength: {
                                            value: 3,
                                            message: 'League name must be at least 3 characters'
                                        },
                                        maxLength: {
                                            value: 100,
                                            message: 'League name must be less than 100 characters'
                                        }
                                    })}
                                />
                            </Field>

                            {/* Description Field */}
                            <Field
                                label="Description"
                                optionalText="(Optional)"
                                helperText="Add a description for your league"
                            >
                                <Input
                                    placeholder="Enter league description (optional)"
                                    {...control.register('description', {
                                        maxLength: {
                                            value: 500,
                                            message: 'Description must be less than 500 characters'
                                        }
                                    })}
                                />
                            </Field>

                            {/* Member Emails Field */}
                            <Field
                                label="Invite Members"
                                optionalText="(Optional)"
                                helperText="Add member emails to invite them to your league"
                            >
                                <Stack gap={2}>
                                    {fields.map((field, index) => (
                                        <Stack key={field.id} direction="row" gap={2}>
                                            <Input
                                                type="email"
                                                placeholder="member@example.com"
                                                {...control.register(`members.${index}.email`, {
                                                    pattern: {
                                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                        message: 'Invalid email address'
                                                    }
                                                })}
                                            />
                                            {fields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    colorScheme="red"
                                                    onClick={() => remove(index)}
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </Stack>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => append({ email: '' })}
                                    >
                                        Add Another Member
                                    </Button>
                                </Stack>
                            </Field>
                        </Stack>
                    </DialogBody>
                    <DialogFooter>
                        <DialogActionTrigger asChild>
                            <Button variant="outline" disabled={isSubmitting}>
                                Cancel
                            </Button>
                        </DialogActionTrigger>
                        <Button
                            type="submit"
                            loading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            Create League
                        </Button>
                    </DialogFooter>
                    <DialogCloseTrigger />
                </form>
            </DialogContent>
        </DialogRoot>
    );
}
