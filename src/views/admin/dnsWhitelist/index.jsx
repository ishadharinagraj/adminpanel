import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Badge,
  useColorModeValue,
  useDisclosure,
  useToast,
  FormLabel,
  FormControl,
  HStack,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Grid,
} from "@chakra-ui/react";

// Custom components
import Card from "components/card/Card";

// Icons
import {
  MdSearch,
  MdAdd,
  MdDns,
  MdRefresh,
  MdDelete,
  MdCheckCircle,
  MdBlock,
  MdSecurity,
} from "react-icons/md";

const BACKEND_URL = process.env.REACT_APP_ADMIN_BACKEND_URL || "http://localhost:8080";

// Helper to normalize record objects
const normalizeRecord = (item) => ({
  id: item.id,
  dns: item.dns || item.domain || "",
  is_active: item.is_active !== undefined ? Boolean(item.is_active) : (item.status === "Active"),
  created_at: item.created_at || new Date().toISOString().replace("T", " ").substring(0, 19),
});

// Initial fallback mock data in case backend API is connecting
const initialWhitelistData = [
  {
    id: 1,
    dns: "*",
    is_active: true,
    created_at: "2026-09-01 10:00:00",
  },
  {
    id: 2,
    dns: "xtream.example.com",
    is_active: true,
    created_at: "2026-09-02 14:30:00",
  },
  {
    id: 3,
    dns: "dns.org:8080",
    is_active: true,
    created_at: "2026-09-03 09:15:00",
  },
];

export default function DnsWhitelistManagement() {
  const toast = useToast();

  // Add Modal State
  const {
    isOpen: isAddOpen,
    onOpen: onAddOpen,
    onClose: onAddClose,
  } = useDisclosure();

  // Delete Alert State
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const cancelRef = React.useRef();

  // Data State
  const [records, setRecords] = useState(initialWhitelistData);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingRecord, setDeletingRecord] = useState(null);

  // Form State
  const [domainInput, setDomainInput] = useState("");
  const [statusInput, setStatusInput] = useState("Active");

  // Colors
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = useColorModeValue("secondaryGray.600", "gray.400");
  const cardBg = useColorModeValue("white", "navy.800");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const iconBoxBg = useColorModeValue("secondaryGray.300", "navy.700");

  // Fetch Whitelisted DNS Records from Backend
  const fetchDnsWhitelist = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/dns-whitelist`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setRecords(data.map(normalizeRecord));
          toast({
            title: "DNS Whitelist Refreshed",
            status: "success",
            duration: 2000,
            isClosable: true,
          });
        }
      }
    } catch (err) {
      console.warn("Backend API unavailable, displaying current local state.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDnsWhitelist();
  }, []);

  // Filter records
  const filteredRecords = records.filter((r) =>
    (r.dns || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add Whitelist Record
  const handleAddWhitelist = async () => {
    if (!domainInput.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid DNS Domain or Server URL.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newRecordPayload = {
      dns: domainInput.trim(),
      domain: domainInput.trim(),
      is_active: statusInput === "Active",
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/dns-whitelist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecordPayload),
      });

      const data = await response.json();

      if (response.ok) {
        setRecords([normalizeRecord(data), ...records]);
        toast({
          title: "DNS Whitelisted",
          description: `Successfully added ${domainInput} to MySQL database.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Failed to Add DNS",
          description: data.message || "Error saving record to database.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (err) {
      // Local fallback
      const mockNew = normalizeRecord({
        id: Date.now(),
        ...newRecordPayload,
        created_at: new Date().toISOString().replace("T", " ").substring(0, 19),
      });
      setRecords([mockNew, ...records]);

      toast({
        title: "DNS Whitelisted (Demo)",
        description: `Added ${domainInput} to local records.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    }

    setDomainInput("");
    onAddClose();
  };

  // Trigger Delete Modal
  const promptDelete = (record) => {
    setDeletingRecord(record);
    onDeleteOpen();
  };

  // Confirm Delete Record
  const confirmDeleteRecord = async () => {
    if (!deletingRecord) return;

    try {
      await fetch(`${BACKEND_URL}/api/admin/dns-whitelist/${deletingRecord.id}`, {
        method: "DELETE",
      });

      setRecords(records.filter((r) => r.id !== deletingRecord.id));

      toast({
        title: "DNS Record Deleted",
        description: `Removed ${deletingRecord.domain} from whitelist.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      setRecords(records.filter((r) => r.id !== deletingRecord.id));
      toast({
        title: "DNS Record Deleted",
        description: `Removed ${deletingRecord.domain} from records.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
      setDeletingRecord(null);
    }
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      {/* Header */}
      <Flex justifyContent="space-between" align="center" mb="24px">
        <Box>
          <Heading color={textColor} fontSize="28px" mb="4px">
            DNS Whitelist Management
          </Heading>
          <Text color={textColorSecondary} fontSize="md">
            Manage allowed WebTV Portal DNS domains and server URLs.
          </Text>
        </Box>

        <Button
          leftIcon={<Icon as={MdAdd} w="20px" h="20px" />}
          variant="brand"
          fontWeight="500"
          borderRadius="14px"
          px="20px"
          onClick={onAddOpen}
        >
          Add Whitelist DNS
        </Button>
      </Flex>

      {/* Summary Stat Cards */}
      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(3, 1fr)",
        }}
        gap="20px"
        mb="24px"
      >
        <Card p="20px">
          <Flex align="center">
            <Flex
              w="56px"
              h="56px"
              borderRadius="16px"
              bg={iconBoxBg}
              align="center"
              justify="center"
              me="16px"
            >
              <Icon as={MdSecurity} w="30px" h="30px" color="brand.500" />
            </Flex>
            <Box>
              <Text color={textColorSecondary} fontSize="sm" fontWeight="500">
                Whitelisted Domains
              </Text>
              <Heading color={textColor} fontSize="24px" fontWeight="700">
                {records.length}
              </Heading>
            </Box>
          </Flex>
        </Card>

        <Card p="20px">
          <Flex align="center">
            <Flex
              w="56px"
              h="56px"
              borderRadius="16px"
              bg="green.50"
              align="center"
              justify="center"
              me="16px"
            >
              <Icon as={MdCheckCircle} w="30px" h="30px" color="green.500" />
            </Flex>
            <Box>
              <Text color={textColorSecondary} fontSize="sm" fontWeight="500">
                Active Rules
              </Text>
              <Heading color={textColor} fontSize="24px" fontWeight="700">
                {records.filter((r) => r.is_active).length}
              </Heading>
            </Box>
          </Flex>
        </Card>

        <Card p="20px">
          <Flex align="center">
            <Flex
              w="56px"
              h="56px"
              borderRadius="16px"
              bg="purple.50"
              align="center"
              justify="center"
              me="16px"
            >
              <Icon as={MdDns} w="30px" h="30px" color="purple.500" />
            </Flex>
            <Box>
              <Text color={textColorSecondary} fontSize="sm" fontWeight="500">
                Allow-All (*) Active
              </Text>
              <Heading color={textColor} fontSize="24px" fontWeight="700">
                {records.some((r) => (r.dns || r.domain) === "*") ? "Enabled" : "Disabled"}
              </Heading>
            </Box>
          </Flex>
        </Card>
      </Grid>

      {/* Main Table Card */}
      <Card p="20px" borderRadius="20px" bg={cardBg}>
        {/* Search & Actions Toolbar */}
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          mb="20px"
          gap="16px"
        >
          <InputGroup maxW={{ base: "100%", md: "380px" }}>
            <InputLeftElement pointerEvents="none">
              <Icon as={MdSearch} color="gray.400" w="20px" h="20px" />
            </InputLeftElement>
            <Input
              placeholder="Search whitelisted DNS or domain..."
              borderRadius="14px"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          <HStack spacing="12px">
            <Button
              leftIcon={<Icon as={MdRefresh} w="18px" h="18px" />}
              variant="action"
              borderRadius="14px"
              isLoading={loading}
              onClick={fetchDnsWhitelist}
            >
              Refresh
            </Button>
          </HStack>
        </Flex>

        {/* Table */}
        <Box overflowX="auto">
          <Table variant="simple" color="gray.500" mb="24px">
            <Thead>
              <Tr my=".5rem" pl="0px" borderColor={borderColor}>
                <Th color="gray.400">ID</Th>
                <Th color="gray.400">DNS Domain / Server URL</Th>
                <Th color="gray.400">Status</Th>
                <Th color="gray.400">Date Added</Th>
                <Th color="gray.400" textAlign="right">
                  Actions
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <Tr key={record.id} borderColor={borderColor}>
                    <Td fontWeight="bold" color={textColor} width="80px">
                      #{record.id}
                    </Td>

                    <Td>
                      <HStack spacing="8px">
                        <Icon as={MdDns} color="brand.500" boxSize="18px" />
                        <Text
                          color={textColor}
                          fontWeight="700"
                          fontSize="sm"
                          fontFamily="monospace"
                        >
                          {record.dns || record.domain}
                        </Text>
                        {(record.dns || record.domain) === "*" && (
                          <Badge colorScheme="purple" ml="2" borderRadius="full">
                            Global Wildcard
                          </Badge>
                        )}
                      </HStack>
                    </Td>

                    <Td>
                      {record.is_active ? (
                        <Badge colorScheme="green" px="3" py="1" borderRadius="full">
                          Whitelisted
                        </Badge>
                      ) : (
                        <Badge colorScheme="gray" px="3" py="1" borderRadius="full">
                          Disabled
                        </Badge>
                      )}
                    </Td>

                    <Td>
                      <Text color={textColorSecondary} fontSize="sm">
                        {record.created_at || "2026-09-05"}
                      </Text>
                    </Td>

                    <Td textAlign="right">
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        leftIcon={<Icon as={MdDelete} />}
                        onClick={() => promptDelete(record)}
                      >
                        Delete
                      </Button>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={5} textAlign="center" py="40px">
                    <Text color={textColorSecondary} fontSize="md">
                      No whitelisted DNS records found.
                    </Text>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
      </Card>

      {/* Add Whitelist DNS Modal */}
      <Modal isOpen={isAddOpen} onClose={onAddClose} size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="20px" bg={cardBg}>
          <ModalHeader color={textColor}>Add Whitelist DNS Domain</ModalHeader>
          <ModalCloseButton color={textColor} />
          <ModalBody pb={6}>
            <FormControl isRequired mb="16px">
              <FormLabel color={textColor} fontSize="sm" fontWeight="600">
                DNS Domain / Server URL
              </FormLabel>
              <Input
                placeholder="e.g. panel.example.com, dns.com:8080, or *"
                borderRadius="12px"
                color={textColor}
                _placeholder={{ color: "gray.400" }}
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
              />
              <Text color={textColorSecondary} fontSize="xs" mt="6px">
                Use <strong>*</strong> to allow all WebTV portals, or specify an exact domain/port.
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel color={textColor} fontSize="sm" fontWeight="600">
                Status Rule
              </FormLabel>
              <Select
                borderRadius="12px"
                color={textColor}
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
              >
                <option value="Active">Active (Allowed)</option>
                <option value="Disabled">Disabled</option>
              </Select>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddClose} borderRadius="12px">
              Cancel
            </Button>
            <Button variant="brand" onClick={handleAddWhitelist} borderRadius="12px">
              Add Record
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="20px">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color={textColor}>
              Delete Whitelist DNS Record
            </AlertDialogHeader>

            <AlertDialogBody color={textColorSecondary}>
              Are you sure you want to remove <strong>{deletingRecord?.domain}</strong> from the whitelist?
              Clients using this DNS might lose access to WebTV streams.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose} borderRadius="12px">
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={confirmDeleteRecord}
                ml={3}
                borderRadius="12px"
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
