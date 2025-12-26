'use client';

import { Field } from './ui/field';
import { useForm, useFieldArray } from 'react-hook-form';
import { createLeague } from '@/actions/league';
import { toast } from '@/components/ui/toaster';
import { useRouter } from 'next/navigation';
import { useLeagues } from '@/app/hooks';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
    DialogClose
} from '@/components/ui/dialog';

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
            toast.error(result.error.message);
            return;
        }

        toast.success('League created successfully');

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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="solid">
                    NEW LEAGUE
                </Button>
            </DialogTrigger>
            <DialogContent className="p-0">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader className="border-b p-4">
                        <DialogTitle className="font-roboto-mono text-xs tracking-[0.025rem]">CREATE NEW LEAGUE</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 p-4">
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
                            label="DESCRIPTION"
                            optionalText="Optional"
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
                            optionalText="Optional"
                            helperText="Add member emails to invite them to your league"
                        >
                            <div className="space-y-2">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-2">
                                        <Input
                                            type="email"
                                            placeholder="member@example.com"
                                            className="flex-1"
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
                                                variant="destructive"
                                                onClick={() => remove(index)}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ email: '' })}
                                    className="w-full"
                                >
                                    Add Another Member
                                </Button>
                            </div>
                        </Field>
                    </div>
                    <DialogFooter className="p-4">
                        <DialogClose asChild>
                            <Button size="sm" variant="outline" disabled={isSubmitting}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            size="sm"
                            type="submit"
                            loading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            Create League
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
