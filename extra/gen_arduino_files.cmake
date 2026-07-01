# Copyright (c) Arduino s.r.l. and/or its affiliated companies
# SPDX-License-Identifier: Apache-2.0

# get root dir for the project
cmake_path(SET TOP_DIR NORMALIZE ${CMAKE_CURRENT_LIST_DIR}/..)

# get list of variants to be applied
if(CMAKE_ARGC GREATER 3)
	# cmake -P <script> <variant> ...
	foreach(index RANGE 4 ${CMAKE_ARGC})
		math(EXPR index "${index} - 1")
		list(APPEND VARIANTS "${CMAKE_ARGV${index}}")
	endforeach()
	list(TRANSFORM VARIANTS REPLACE "/$" "")
	list(TRANSFORM VARIANTS REPLACE ".*/" "")
else()
	# build for all valid variants
	file(GLOB VARIANTS RELATIVE ${TOP_DIR}/variants variants/*)
	list(REMOVE_ITEM VARIANTS llext linked)
endif()

foreach(variant ${VARIANTS})
	if(NOT IS_DIRECTORY variants/${variant})
		continue()
	endif()

	cmake_path(SET dir ${TOP_DIR}/variants/${variant} NORMALIZE)
	if(NOT EXISTS ${dir}/llext-edk/cmake.cflags)
		continue()
	endif()

	message(STATUS "Processing ${variant}")
	include(${dir}/llext-edk/cmake.cflags)

	set(edk_include_flags ${LLEXT_ALL_INCLUDE_CFLAGS})
	set(arduino_api_include_flags ${edk_include_flags})
	list(FILTER arduino_api_include_flags INCLUDE REGEX "-I.*/include/modules/lib/Arduino-Zephyr-API/")
	list(FILTER edk_include_flags EXCLUDE REGEX "-I.*/include/modules/lib/Arduino-Zephyr-API/")

	set(reordered_edk_include_flags "")
	set(inserted_arduino_api_includes FALSE)
	foreach(flag IN LISTS edk_include_flags)
		# Keep Arduino API headers ahead of HAL headers so Windows does not
		# resolve <SPI.h> to the CMSIS spi.h from the HAL package.
		if(NOT inserted_arduino_api_includes AND flag MATCHES "-I.*/include/modules/hal/")
			list(APPEND reordered_edk_include_flags ${arduino_api_include_flags})
			set(inserted_arduino_api_includes TRUE)
		endif()

		list(APPEND reordered_edk_include_flags ${flag})
	endforeach()

	if(NOT inserted_arduino_api_includes)
		list(APPEND reordered_edk_include_flags ${arduino_api_include_flags})
	endif()

	list(TRANSFORM reordered_edk_include_flags REPLACE "-I${dir}" "-iwithprefixbefore")
	list(JOIN reordered_edk_include_flags " " EDK_INCLUDES)
	file(WRITE ${dir}/includes.txt "${EDK_INCLUDES}")

	# exclude -imacros entries in platform from the list, make sure no others are present
	list(FILTER LLEXT_BASE_CFLAGS EXCLUDE REGEX "-imacros.*autoconf.h")
	list(FILTER LLEXT_BASE_CFLAGS EXCLUDE REGEX "-imacros.*zephyr_stdint.h")
	set(other_imacros "${LLEXT_BASE_CFLAGS}")
	list(FILTER other_imacros INCLUDE REGEX "-imacros.*")
	if(other_imacros)
		message(FATAL_ERROR "Unexpected -imacros in LLEXT_BASE_CFLAGS: ${other_imacros}")
	endif()

	# exclude other problematic macros shared between C and C++
	list(FILTER LLEXT_BASE_CFLAGS EXCLUDE REGEX "-fdiagnostics-color=always")

	# (temp) generate C++ flags from C flags
	set(LLEXT_BASE_CXXFLAGS ${LLEXT_BASE_CFLAGS})
	list(FILTER LLEXT_BASE_CXXFLAGS EXCLUDE REGEX "-Wno-pointer-sign")
	list(FILTER LLEXT_BASE_CXXFLAGS EXCLUDE REGEX "-Werror=implicit-int")
	list(FILTER LLEXT_BASE_CXXFLAGS EXCLUDE REGEX "-std=c.*")

	# save flag files
	# LLEXT_BASE_CFLAGS comes from a serialized CMake string that may contain
	# quoted semicolon-separated sublists. Strip quotes first, then flatten the
	# semicolons into spaces so Arduino IDE passes each flag as a separate arg.
	string(REPLACE "'" "" EDK_CFLAGS "${LLEXT_BASE_CFLAGS}")
	string(REPLACE ";" " " EDK_CFLAGS "${EDK_CFLAGS}")
	file(WRITE ${dir}/cflags.txt "${EDK_CFLAGS}")

	string(REPLACE "'" "" EDK_CXXFLAGS "${LLEXT_BASE_CXXFLAGS}")
	string(REPLACE ";" " " EDK_CXXFLAGS "${EDK_CXXFLAGS}")
	file(WRITE ${dir}/cxxflags.txt "${EDK_CXXFLAGS}")
endforeach()
