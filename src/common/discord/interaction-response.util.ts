import { SlashCommandContext } from 'necord';

const DISCORD_UNKNOWN_INTERACTION_CODE = 10062;

type SlashInteraction = SlashCommandContext[0];

// Unknown interaction 여부 판별
export function isUnknownInteractionError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === DISCORD_UNKNOWN_INTERACTION_CODE
  );
}

// Unknown interaction은 무시하고 editReply 수행
export async function safeEditReply(
  interaction: SlashInteraction,
  message: string,
): Promise<void> {
  try {
    await interaction.editReply({ content: message });
  } catch (error) {
    if (isUnknownInteractionError(error)) {
      return;
    }

    throw error;
  }
}

// Unknown interaction은 무시하고 reply 수행
export async function safeReply(
  interaction: SlashInteraction,
  message: string,
): Promise<void> {
  try {
    await interaction.reply({ content: message });
  } catch (error) {
    if (isUnknownInteractionError(error)) {
      return;
    }

    throw error;
  }
}
