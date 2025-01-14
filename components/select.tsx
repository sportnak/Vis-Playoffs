import { Box, Icon, Input } from '@chakra-ui/react';
import { BiChevronDown } from 'react-icons/bi';
import { InputGroup } from './ui/input-group';
import { useEffect, useRef, useState } from 'react';

export function Select({
    value,
    items,
    onChange
}: {
    value: { label: string; value: string };
    items: { label: string; value: string }[];
    onChange: (value: { label: string; value: string }) => void;
}) {
    const [showOptions, setShowOptions] = useState(false);
    const parentRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (parentRef.current && !parentRef.current.contains(event.target as Node)) {
                setShowOptions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <Box w="100%" ref={parentRef} position="relative" cursor="pointer">
            <InputGroup
                w="100%"
                endElement={
                    <Icon fontSize="20px">
                        <BiChevronDown />
                    </Icon>
                }
                _focus={{
                    borderColor: 'initial'
                }}
            >
                <Input
                    onClick={() => setShowOptions(true)}
                    style={{ cursor: 'pointer', width: '100%', background: 'rgba(169, 169, 169, 0.1)' }} // Opaque gray
                    variant="subtle"
                    value={value?.label ?? ''}
                    readOnly
                />
            </InputGroup>
            {showOptions && (
                <Box
                    position="absolute"
                    bg="white"
                    w="100%"
                    style={{
                        borderRadius: '3px',
                        zIndex: 10,
                        marginTop: '2px',
                        fontSize: '14px'
                    }}
                    boxShadow={'0 4px 8px rgba(0, 0, 0, .1)'}
                >
                    {items.map((item) => (
                        <Box
                            cursor={'pointer'}
                            style={{
                                width: '100%',
                                cursor: 'pointer',
                                padding: '6px'
                            }}
                            _hover={{
                                bg: 'gray.100'
                            }}
                            key={item.value}
                            onClick={() => {
                                setShowOptions(false);
                                onChange(item);
                            }}
                        >
                            {item.label}
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}
