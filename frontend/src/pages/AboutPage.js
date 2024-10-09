import React from "react";
import {
  Card,
  CardHeader,
  Heading,
  CardBody,
  Stack,
  Flex,
} from "@chakra-ui/react";
import BackToHomeButton from "../components/BackToHomeButton";

function AboutPage() {
  return (
    <Flex direction="column" h="100vh" maxW="lg" mx="auto" p={4} bg="lightgray">
      <Card p={4}>
        <BackToHomeButton />
        <CardHeader>
          <Heading size="md" fontSize="30px">
            Vartalaap v1.1.0
          </Heading>
        </CardHeader>
        <CardBody>
          <Stack bg="" w="100%" p={4} color="" spacing={5}>
            <div>
              This Varta(Vartalaap) app is designed by Mohit for chatting.
              Developed using ReactJs, Chakra-UI, NodeJs and MongoDB
            </div>
          </Stack>
        </CardBody>
      </Card>
    </Flex>
  );
}

export default AboutPage;
