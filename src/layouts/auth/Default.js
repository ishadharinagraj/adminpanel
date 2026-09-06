// Chakra imports
import { Box, Flex } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import Footer from "components/footer/FooterAuth";
import FixedPlugin from "components/fixedPlugin/FixedPlugin";
// Custom components
import { NavLink } from "react-router-dom";
import { Lottie } from "lottie-react";

function AuthIllustration(props) {
  const { children, illustrationBackground, lottieAnimation } = props;

  return (
    <Flex position='relative' h='max-content'>
      <Flex
        h={{
          sm: "initial",
          md: "unset",
          lg: "100vh",
          xl: "97vh",
        }}
        w='100%'
        maxW={{ md: "66%", lg: "1313px" }}
        mx='auto'
        pt={{ sm: "50px", md: "0px" }}
        px={{ lg: "30px", xl: "0px" }}
        ps={{ xl: "70px" }}
        justifyContent='start'
        direction='column'>
        <NavLink
          to='/admin'
          style={() => ({
            width: "fit-content",
            marginTop: "40px",
          })}>
        </NavLink>
        {children}
        <Box
          display={{ base: "none", md: "block" }}
          h='100%'
          minH='100vh'
          w={{ lg: "50vw", "2xl": "44vw" }}
          position='absolute'
          right='0px'>
          <Flex
            bg={!lottieAnimation && illustrationBackground ? `url(${illustrationBackground})` : undefined}
            bgGradient={lottieAnimation ? 'linear(to-b, brand.600, brand.400)' : undefined}
            justify='center'
            align='center'
            w='100%'
            h='100%'
            bgSize='cover'
            bgPosition='50%'
            position='absolute'
            overflow='hidden'
            borderBottomLeftRadius={{ lg: "120px", xl: "200px" }}>
            {lottieAnimation ? (
              <Box w='85%' maxW='550px' h='auto'>
                <Lottie src={lottieAnimation} loop={true} autoplay={true} />
              </Box>
            ) : null}
          </Flex>
        </Box>
        <Footer />
      </Flex>
      <FixedPlugin />
    </Flex>
  );
}

// PROPS
AuthIllustration.propTypes = {
  illustrationBackground: PropTypes.string,
  lottieAnimation: PropTypes.object,
  image: PropTypes.any,
};

export default AuthIllustration;
