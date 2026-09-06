import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  Grid,
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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";

// Custom components
import Card from "components/card/Card";
import { API_BASE_URL } from "config/apiConfig";

// Icons
import {
  MdSearch,
  MdAdd,
  MdTv,
  MdPeople,
  MdCheckCircle,
  MdWarning,
  MdMoreVert,
  MdEdit,
  MdDelete,
  MdRefresh,
  MdDns,
} from "react-icons/md";

// Initial sample clients data
const initialClientsData = [
  {
    id: 1,
    name: "Alex Morgan",
    email: "alex.m@gmail.com",
    dns_url: "http://webtv-dns1.com:8080/c/",
    mac_address: "00:1A:79:4D:2E:8F",
    plan: "12 Months VIP WebTV",
    expiry_date: "2026-12-31",
    status: "Active",
  },
  {
    id: 2,
    name: "David Beckham",
    email: "david.b@yahoo.com",
    dns_url: "http://webtv-dns2.net:8080/live/",
    mac_address: "00:1A:79:9C:11:AA",
    plan: "6 Months Premium WebTV",
    expiry_date: "2026-10-15",
    status: "Active",
  },
  {
    id: 3,
    name: "Sophia Martinez",
    email: "sophia.m@outlook.com",
    dns_url: "http://portal-webtv.org:8000/",
    mac_address: "00:1A:79:33:44:55",
    plan: "1 Month Trial",
    expiry_date: "2026-09-10",
    status: "Expiring Soon",
  },
  {
    id: 4,
    name: "Robert Smith",
    email: "robert.smith@tech.io",
    dns_url: "http://server-dns3.tv:8080/c/",
    mac_address: "00:1A:79:88:99:00",
    plan: "12 Months VIP WebTV",
    expiry_date: "2026-04-01",
    status: "Expired",
  },
];

export default function ClientsManagement() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // State
  const [clients, setClients] = useState(initialClientsData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Form State for Add / Edit
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dns_url: "http://webtv-dns1.com:8080/c/",
    mac_address: "",
    plan: "12 Months VIP WebTV",
    expiry_date: "2026-12-31",
    status: "Active",
  });

  // Colors
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = useColorModeValue("secondaryGray.600", "gray.400");
  const cardBg = useColorModeValue("white", "navy.800");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const iconBoxBg = useColorModeValue("secondaryGray.300", "navy.700");

  // Fetch clients from backend
  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/clients`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data) && data.length > 0) {
          setClients(data);
        }
      }
    } catch (err) {
      console.log("Using local clients state");
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Filter clients
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.mac_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.dns_url.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || client.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormData({
      name: "",
      email: "",
      dns_url: "http://webtv-dns1.com:8080/c/",
      mac_address: "00:1A:79:" + Math.floor(10 + Math.random() * 89) + ":" + Math.floor(10 + Math.random() * 89) + ":" + Math.floor(10 + Math.random() * 89),
      plan: "12 Months VIP WebTV",
      expiry_date: "2026-12-31",
      status: "Active",
    });
    onOpen();
  };

  // Open modal for Edit
  const handleOpenEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      dns_url: client.dns_url,
      mac_address: client.mac_address,
      plan: client.plan,
      expiry_date: client.expiry_date,
      status: client.status,
    });
    onOpen();
  };

  // Save Client (Create or Update)
  const handleSaveClient = async () => {
    if (!formData.name || !formData.email || !formData.dns_url) {
      toast({
        title: "Validation Error",
        description: "Please fill in Name, Email, and WebTV DNS URL.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (editingClient) {
      // Update local state
      setClients(
        clients.map((c) =>
          c.id === editingClient.id ? { ...c, ...formData } : c
        )
      );

      // Try backend call
      try {
        await fetch(`${API_BASE_URL}/api/clients/${editingClient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } catch (err) {}

      toast({
        title: "Client Updated",
        description: `Updated DNS and panel record for ${formData.name}.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else {
      // Create new client
      const newClient = { id: Date.now(), ...formData };
      setClients([newClient, ...clients]);

      // Try backend call
      try {
        await fetch(`${API_BASE_URL}/api/clients`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } catch (err) {}

      toast({
        title: "WebTV Client Added",
        description: `Successfully added ${formData.name} with DNS ${formData.dns_url}.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }

    onClose();
  };

  // Delete Client
  const handleDeleteClient = async (id, name) => {
    setClients(clients.filter((c) => c.id !== id));
    try {
      await fetch(`${API_BASE_URL}/api/clients/${id}`, {
        method: "DELETE",
      });
    } catch (err) {}

    toast({
      title: "Client Removed",
      description: `Removed ${name} from records.`,
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  // Status Badge styling
  const renderStatusBadge = (status) => {
    if (status === "Active") {
      return <Badge colorScheme="green" px="3" py="1" borderRadius="full">Active</Badge>;
    } else if (status === "Expiring Soon") {
      return <Badge colorScheme="orange" px="3" py="1" borderRadius="full">Expiring Soon</Badge>;
    } else {
      return <Badge colorScheme="red" px="3" py="1" borderRadius="full">Expired</Badge>;
    }
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      {/* Page Title */}
      <Flex justifyContent="space-between" align="center" mb="24px">
        <Box>
          <Heading color={textColor} fontSize="28px" mb="4px">
            WebTV Clients & DNS Record Panel
          </Heading>
          <Text color={textColorSecondary} fontSize="md">
            Manage WebTV subscribers, Portal DNS, MAC addresses, and active plan records.
          </Text>
        </Box>
        <Button
          leftIcon={<Icon as={MdAdd} w="20px" h="20px" />}
          variant="brand"
          fontWeight="500"
          borderRadius="14px"
          px="20px"
          onClick={handleOpenCreate}
        >
          Add WebTV Client
        </Button>
      </Flex>

      {/* Summary Stat Cards */}
      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
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
              <Icon as={MdPeople} w="30px" h="30px" color="brand.500" />
            </Flex>
            <Box>
              <Text color={textColorSecondary} fontSize="sm" fontWeight="500">
                Total Clients
              </Text>
              <Heading color={textColor} fontSize="24px" fontWeight="700">
                {clients.length}
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
                Active WebTV DNS
              </Text>
              <Heading color={textColor} fontSize="24px" fontWeight="700">
                {clients.filter((c) => c.status === "Active").length}
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
              bg="orange.50"
              align="center"
              justify="center"
              me="16px"
            >
              <Icon as={MdWarning} w="30px" h="30px" color="orange.500" />
            </Flex>
            <Box>
              <Text color={textColorSecondary} fontSize="sm" fontWeight="500">
                Expiring Soon
              </Text>
              <Heading color={textColor} fontSize="24px" fontWeight="700">
                {clients.filter((c) => c.status === "Expiring Soon").length}
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
              bg="blue.50"
              align="center"
              justify="center"
              me="16px"
            >
              <Icon as={MdDns} w="30px" h="30px" color="blue.500" />
            </Flex>
            <Box>
              <Text color={textColorSecondary} fontSize="sm" fontWeight="500">
                WebTV Portals
              </Text>
              <Heading color={textColor} fontSize="24px" fontWeight="700">
                {new Set(clients.map((c) => c.dns_url)).size}
              </Heading>
            </Box>
          </Flex>
        </Card>
      </Grid>

      {/* Main Table Card */}
      <Card p="20px" borderRadius="20px" bg={cardBg}>
        {/* Filter and Search Bar */}
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
              placeholder="Search by client name, email, MAC or DNS..."
              borderRadius="14px"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          <HStack spacing="12px">
            <Select
              w="180px"
              borderRadius="14px"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
            </Select>

            <IconButton
              icon={<Icon as={MdRefresh} w="20px" h="20px" />}
              aria-label="Refresh Data"
              borderRadius="14px"
              onClick={fetchClients}
            />
          </HStack>
        </Flex>

        {/* Table */}
        <Box overflowX="auto">
          <Table variant="simple" color="gray.500" mb="24px">
            <Thead>
              <Tr my=".5rem" pl="0px" borderColor={borderColor}>
                <Th color="gray.400">Client Name & Email</Th>
                <Th color="gray.400">WebTV Portal DNS</Th>
                <Th color="gray.400">MAC / Device ID</Th>
                <Th color="gray.400">Plan</Th>
                <Th color="gray.400">Expiry Date</Th>
                <Th color="gray.400">Status</Th>
                <Th color="gray.400" textAlign="right">
                  Actions
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <Tr key={client.id} borderColor={borderColor}>
                    <Td>
                      <Flex align="center">
                        <Flex
                          w="40px"
                          h="40px"
                          borderRadius="12px"
                          bg="brand.50"
                          color="brand.500"
                          align="center"
                          justify="center"
                          fontWeight="bold"
                          me="12px"
                        >
                          {client.name.charAt(0)}
                        </Flex>
                        <Box>
                          <Text color={textColor} fontWeight="bold" fontSize="md">
                            {client.name}
                          </Text>
                          <Text color={textColorSecondary} fontSize="xs">
                            {client.email}
                          </Text>
                        </Box>
                      </Flex>
                    </Td>

                    <Td>
                      <HStack spacing="6px">
                        <Icon as={MdDns} color="brand.500" boxSize="18px" />
                        <Text
                          color={textColor}
                          fontWeight="600"
                          fontSize="sm"
                          fontFamily="monospace"
                        >
                          {client.dns_url}
                        </Text>
                      </HStack>
                    </Td>

                    <Td>
                      <Text
                        color={textColorSecondary}
                        fontSize="xs"
                        fontWeight="600"
                        fontFamily="monospace"
                        bg="gray.100"
                        _dark={{ bg: "whiteAlpha.100" }}
                        px="8px"
                        py="4px"
                        borderRadius="6px"
                        display="inline-block"
                      >
                        {client.mac_address}
                      </Text>
                    </Td>

                    <Td>
                      <Text color={textColor} fontWeight="500" fontSize="sm">
                        {client.plan}
                      </Text>
                    </Td>

                    <Td>
                      <Text color={textColorSecondary} fontSize="sm">
                        {client.expiry_date}
                      </Text>
                    </Td>

                    <Td>{renderStatusBadge(client.status)}</Td>

                    <Td textAlign="right">
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<Icon as={MdMoreVert} w="20px" h="20px" />}
                          variant="ghost"
                          borderRadius="10px"
                          size="sm"
                        />
                        <MenuList>
                          <MenuItem
                            icon={<Icon as={MdEdit} color="blue.500" />}
                            onClick={() => handleOpenEdit(client)}
                          >
                            Edit Client & DNS
                          </MenuItem>
                          <MenuItem
                            icon={<Icon as={MdDelete} color="red.500" />}
                            onClick={() =>
                              handleDeleteClient(client.id, client.name)
                            }
                          >
                            Delete Client
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={7} textAlign="center" py="40px">
                    <Text color={textColorSecondary} fontSize="md">
                      No clients found matching your filter criteria.
                    </Text>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
      </Card>

      {/* Add / Edit Client Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="20px" bg={cardBg}>
          <ModalHeader color={textColor}>
            {editingClient ? "Edit WebTV Client & DNS Record" : "Add New WebTV Client"}
          </ModalHeader>
          <ModalCloseButton color={textColor} />
          <ModalBody pb={6}>
            <VStack spacing="16px">
              <FormControl isRequired>
                <FormLabel color={textColor} fontSize="sm" fontWeight="600">
                  Client Full Name
                </FormLabel>
                <Input
                  placeholder="e.g. John Doe"
                  borderRadius="12px"
                  color={textColor}
                  _placeholder={{ color: "gray.400" }}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color={textColor} fontSize="sm" fontWeight="600">
                  Email Address
                </FormLabel>
                <Input
                  type="email"
                  placeholder="e.g. john@example.com"
                  borderRadius="12px"
                  color={textColor}
                  _placeholder={{ color: "gray.400" }}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color={textColor} fontSize="sm" fontWeight="600">
                  WebTV Portal DNS Server URL
                </FormLabel>
                <Input
                  placeholder="http://webtv-dns.com:8080/c/"
                  borderRadius="12px"
                  color={textColor}
                  _placeholder={{ color: "gray.400" }}
                  value={formData.dns_url}
                  onChange={(e) =>
                    setFormData({ ...formData, dns_url: e.target.value })
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel color={textColor} fontSize="sm" fontWeight="600">
                  Device MAC Address
                </FormLabel>
                <Input
                  placeholder="00:1A:79:XX:XX:XX"
                  borderRadius="12px"
                  color={textColor}
                  _placeholder={{ color: "gray.400" }}
                  value={formData.mac_address}
                  onChange={(e) =>
                    setFormData({ ...formData, mac_address: e.target.value })
                  }
                />
              </FormControl>

              <Grid templateColumns="1fr 1fr" gap="16px" w="100%">
                <FormControl>
                  <FormLabel color={textColor} fontSize="sm" fontWeight="600">
                    Subscription Plan
                  </FormLabel>
                  <Select
                    borderRadius="12px"
                    color={textColor}
                    value={formData.plan}
                    onChange={(e) =>
                      setFormData({ ...formData, plan: e.target.value })
                    }
                  >
                    <option value="12 Months VIP WebTV">12 Months VIP WebTV</option>
                    <option value="6 Months Premium WebTV">
                      6 Months Premium WebTV
                    </option>
                    <option value="1 Month Trial">1 Month Trial</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel color={textColor} fontSize="sm" fontWeight="600">
                    Expiry Date
                  </FormLabel>
                  <Input
                    type="date"
                    borderRadius="12px"
                    color={textColor}
                    value={formData.expiry_date}
                    onChange={(e) =>
                      setFormData({ ...formData, expiry_date: e.target.value })
                    }
                  />
                </FormControl>
              </Grid>

              <FormControl>
                <FormLabel color={textColor} fontSize="sm" fontWeight="600">
                  Status
                </FormLabel>
                <Select
                  borderRadius="12px"
                  color={textColor}
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Expiring Soon">Expiring Soon</option>
                  <option value="Expired">Expired</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} borderRadius="12px">
              Cancel
            </Button>

            <Button variant="brand" onClick={handleSaveClient} borderRadius="12px">
              {editingClient ? "Save Changes" : "Add Client"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

// Helper wrapper for VStack in Chakra
function VStack({ children, spacing, ...rest }) {
  return (
    <Flex direction="column" gap={spacing} w="100%" {...rest}>
      {children}
    </Flex>
  );
}
